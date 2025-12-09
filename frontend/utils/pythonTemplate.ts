export const PYTHON_SCRIPT_CONTENT = `import os
import sys
import json
import time
from pathlib import Path

# Yêu cầu cài đặt thư viện:
# pip install google-generativeai

try:
    import google.generativeai as genai
except ImportError:
    print("Lỗi: Chưa cài đặt thư viện 'google-generativeai'.")
    print("Vui lòng chạy lệnh: pip install google-generativeai")
    sys.exit(1)

# Cấu hình API Key
# Bạn có thể set biến môi trường API_KEY hoặc nhập trực tiếp khi chạy
API_KEY = os.environ.get("API_KEY")

def setup_model():
    global API_KEY
    if not API_KEY:
        print("--- Cấu hình Google Gemini API ---")
        API_KEY = input("Vui lòng nhập API Key của bạn: ").strip()
        if not API_KEY:
            print("API Key là bắt buộc để tiếp tục.")
            sys.exit(1)
    
    genai.configure(api_key=API_KEY)
    
    generation_config = {
        "temperature": 0.1,
        "response_mime_type": "application/json",
    }

    # Sử dụng model gemini-2.5-flash để cân bằng tốc độ và chính xác
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=generation_config,
    )

def analyze_image(model, image_path):
    """Gửi ảnh lên Gemini để nhận dạng biển số, màu sắc và góc chụp."""
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
            
        prompt = """
        Analyze this image of a car. 
        1. Identify the license plate number. Ensure it is only alphanumeric characters (A-Z, 0-9). Remove any dots, dashes, or spaces.
        2. Identify the background color of the license plate (White, Yellow, Blue, or Other).
        3. Identify if the image shows the FRONT or REAR of the car.
        
        Return the result in JSON format like this:
        {
            "plateNumber": "29A12345",
            "plateColor": "white",
            "viewpoint": "front" // or "rear", "unknown"
        }
        """
        
        response = model.generate_content([
            {"mime_type": "image/jpeg", "data": image_data},
            prompt
        ])
        
        # Xử lý text trả về để lấy JSON
        text = response.text
        if "\`\`\`json" in text:
            text = text.split("\`\`\`json")[1].split("\`\`\`")[0]
        elif "\`\`\`" in text:
            text = text.split("\`\`\`")[0]
            
        return json.loads(text)
        
    except Exception as e:
        print(f"Lỗi khi phân tích {image_path}: {e}")
        return None

def get_new_filename(original_name, result):
    """Tạo tên file mới dựa trên quy tắc."""
    plate = result.get("plateNumber", "").upper()
    # Chỉ giữ lại ký tự chữ và số
    clean_plate = "".join(c for c in plate if c.isalnum())
    
    color = result.get("plateColor", "other").lower()
    view = result.get("viewpoint", "rear").lower()
    
    # Quy tắc 1: Ký tự màu
    # Trắng -> T, Vàng -> V, Xanh -> X, Khác -> T
    if color == "white":
        color_char = "T"
    elif color == "yellow":
        color_char = "V"
    elif color == "blue":
        color_char = "X"
    else:
        color_char = "T"
        
    # Quy tắc đặc biệt: Nếu biển số có lớn hơn 8 ký tự thì không thêm ký tự màu
    color_suffix = "" if len(clean_plate) > 8 else color_char
    
    # Quy tắc 2: Tiền tố theo góc chụp
    # Phía trước: BS + Biển số + Màu
    # Phía sau (hoặc khác): Biển số + Màu
    if view == "front":
        new_base = f"BS{clean_plate}{color_suffix}"
    else:
        new_base = f"{clean_plate}{color_suffix}"
        
    # Giữ nguyên đuôi file
    ext = os.path.splitext(original_name)[1]
    return f"{new_base}{ext}"

def main():
    print("=== AutoPlate Renamer (Python Tool) ===")
    model = setup_model()
    
    folder_path = input("Nhập đường dẫn thư mục chứa ảnh: ").strip()
    path_obj = Path(folder_path)
    
    if not path_obj.exists() or not path_obj.is_dir():
        print("Đường dẫn không hợp lệ.")
        return

    print(f"Đang quét ảnh trong thư mục: {folder_path}")
    
    # Lọc các file ảnh
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}
    files = [f for f in path_obj.iterdir() if f.suffix.lower() in valid_extensions]
    
    if not files:
        print("Không tìm thấy file ảnh nào.")
        return
        
    print(f"Tìm thấy {len(files)} ảnh. Bắt đầu xử lý...")
    print("-" * 50)
    
    success_count = 0
    
    for file_path in files:
        print(f"> Đang xử lý: {file_path.name}")
        
        result = analyze_image(model, file_path)
        
        if result:
            plate = result.get('plateNumber')
            color = result.get('plateColor')
            view = result.get('viewpoint')
            print(f"  [Kết quả] Biển: {plate} | Màu: {color} | Góc: {view}")
            
            new_name = get_new_filename(file_path.name, result)
            new_path = file_path.parent / new_name
            
            if new_path != file_path:
                try:
                    file_path.rename(new_path)
                    print(f"  [ĐỔI TÊN] {new_name}")
                    success_count += 1
                except Exception as e:
                    print(f"  [LỖI] Không thể đổi tên file: {e}")
            else:
                print("  [BỎ QUA] Tên file đã đúng quy định.")
        
        # Nghỉ nhẹ để tránh rate limit nếu dùng free tier
        time.sleep(1)
        print("-" * 50)

    print(f"Hoàn thành! Đã đổi tên {success_count}/{len(files)} file.")

if __name__ == "__main__":
    main()
`;
