# Autoplate Renamer - Hướng Dẫn Sử Dụng

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
3. [Cài Đặt Và Chạy](#cài-đặt-và-chạy)
4. [Cấu Hình](#cấu-hình)
5. [API Documentation](#api-documentation)
6. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới Thiệu

**Autoplate Renamer** là một ứng dụng web giúp tự động đổi tên biển số xe dựa trên phân tích hình ảnh bằng AI (Google Gemini API).

### Tính Năng Chính:
- 🤖 Phân tích hình ảnh biển số xe bằng AI
- 👥 Quản lý người dùng với phân quyền (Admin/User)
- 📊 Ghi log lịch sử đổi tên
- 🔐 Xác thực JWT
- 📱 Giao diện web responsive
- 🗄️ Cơ sở dữ liệu PostgreSQL

---

## ⚙️ Yêu Cầu Hệ Thống

### Bắt Buộc:
- **Docker** & **Docker Compose** (v20.10+)
- **Node.js** (v20 LTS) - nếu chạy local
- **PostgreSQL** (v16+) - cơ sở dữ liệu
- **Google Gemini API Key** - để phân tích hình ảnh

### Tuỳ Chọn:
- **Git** - để clone repository
- **VS Code** - để phát triển

---

## 🚀 Cài Đặt Và Chạy

### Phương Pháp 1: Sử Dụng Docker Compose (Khuyến Nghị)

#### 1. Clone Repository
```bash
git clone <repository-url>
cd autoplate-renamer
```

#### 2. Cấu Hình File `.env`
```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:
```dotenv
# Database Configuration
DB_TYPE=postgres
DB_HOST=143.198.85.151        # IP hoặc hostname của PostgreSQL server
DB_PORT=5432
DB_USER=mydvh-usr              # Username PostgreSQL
DB_PASSWORD=0vUS2H7bTboOxH     # Password PostgreSQL
DB_NAME=auto-rename-plate-db   # Tên database

# JWT Secret (thay đổi trong production)
JWT_SECRET=MAJ35wIwdiy3zEAB2gJ9t1OZ73ACTr8fm7fMRXRhzZB

# Gemini API Key (bắt buộc)
GEMINI_API_KEY=AIzaSyA8K2C8I8GgX8iII5uRqWaZhU4eB-pQ9UU
```

#### 3. Khởi Động Containers
```bash
# Khởi động lần đầu (build images)
docker-compose up --build

# Hoặc chỉ khởi động nếu đã build
docker-compose up
```

#### 4. Kiểm Tra Trạng Thái
```bash
# Xem logs của backend
docker-compose logs -f autoplate-backend

# Xem logs của frontend
docker-compose logs -f autoplate-frontend
```

---

### Phương Pháp 2: Chạy Local (Phát Triển)

#### Backend
```bash
cd backend
npm install
npm run build
npm run dev  # hoặc npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run dev  # Vite dev server
```

---

## 🔧 Cấu Hình

### File `.env` - Biến Môi Trường

| Biến | Mô Tả | Ví Dụ |
|------|-------|-------|
| `DB_TYPE` | Loại database | `postgres` |
| `DB_HOST` | Host PostgreSQL | `143.198.85.151` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USER` | Username PostgreSQL | `mydvh-usr` |
| `DB_PASSWORD` | Password PostgreSQL | `0vUS2H7bTboOxH` |
| `DB_NAME` | Tên database | `auto-rename-plate-db` |
| `JWT_SECRET` | Secret key cho JWT tokens | `MAJ35wIwdiy3zEAB2gJ9t1OZ73ACTr8fm7fMRXRhzZB` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSyA8K2C8I8GgX8...` |
| `NODE_ENV` | Environment | `production` hoặc `development` |
| `PORT` | Backend port | `5000` |
| `FRONTEND_URL` | URL frontend (CORS) | `http://localhost:3000` |

### Lấy Google Gemini API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com)
2. Đăng nhập bằng Google account
3. Tạo API key mới
4. Copy key và paste vào `.env`

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Đăng Nhập (Login)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "Administrator",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

#### 2. Đăng Ký (Register)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "User Name",
  "password": "password123"
}
```

### Analysis Endpoints

#### 1. Phân Tích Hình Ảnh
```http
POST /analysis/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "imageType": "license_plate"
}
```

**Response:**
```json
{
  "originalText": "29A12345",
  "suggestedName": "VNM_29A12345",
  "confidence": 0.95,
  "details": {
    "province": "Hà Nội",
    "plateType": "car"
  }
}
```

### Logging Endpoints

#### 1. Lấy Lịch Sử Đổi Tên
```http
GET /logs?page=1&limit=10
Authorization: Bearer {token}
```

#### 2. Tạo Log Mới
```http
POST /logs
Authorization: Bearer {token}
Content-Type: application/json

{
  "originalName": "29A12345",
  "newName": "VNM_29A12345"
}
```

### User Endpoints

#### 1. Lấy Thông Tin User
```http
GET /users/profile
Authorization: Bearer {token}
```

#### 2. Cập Nhật Thông Tin User
```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "New Name",
  "phoneNumber": "0123456789"
}
```

---

## 📂 Cấu Trúc Dự Án

```
autoplate-renamer/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts           # Cấu hình TypeORM
│   │   ├── entities/
│   │   │   ├── User.ts               # Entity User
│   │   │   ├── ProcessingLog.ts      # Entity Log
│   │   │   └── SystemConfig.ts       # Entity Config
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts    # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── analysis.routes.ts
│   │   │   ├── log.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── config.routes.ts
│   │   ├── migrations/
│   │   │   └── 1701000000000-InitialSchema.ts
│   │   └── index.ts                 # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── RenamerTool.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── FileRow.tsx
│   │   ├── services/
│   │   │   ├── apiService.ts
│   │   │   ├── dbService.ts
│   │   │   └── geminiService.ts
│   │   ├── utils/
│   │   │   ├── pythonTemplate.ts
│   │   │   └── renamingLogic.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml               # Cấu hình Docker Compose
├── .env                            # Biến môi trường (không commit)
├── .env.example                    # Template biến môi trường
├── README.md                       # Readme chính
├── DEVELOPMENT.md                  # Hướng dẫn phát triển
└── INSTRUCTIONS.md                 # File này
```

---

## 🐛 Troubleshooting

### Vấn Đề: Container Backend Không Khởi Động

#### Lỗi: "Cannot access 'User' before initialization"
**Nguyên Nhân:** Circular dependency trong entities
**Giải Pháp:** Đã fix sử dụng string-based relationships trong `User.ts`

#### Lỗi: "password authentication failed for user"
**Nguyên Nhân:** Sai username/password PostgreSQL
**Giải Pháp:**
```bash
# Kiểm tra credentials trong .env
cat .env

# Kiểm tra kết nối PostgreSQL
psql -h DB_HOST -U DB_USER -d DB_NAME
```

#### Lỗi: "relation 'users' does not exist"
**Nguyên Nhân:** Database chưa được khởi tạo
**Giải Pháp:** `synchronize: true` đã bật - tables sẽ tự động tạo

### Vấn Đề: Admin User Không Được Tạo

**Giải Pháp:**
Xóa database và restart:
```bash
# Xóa containers và volumes
docker-compose down -v

# Khởi động lại
docker-compose up --build
```

Hoặc tạo admin user thủ công:
```bash
docker-compose exec autoplate-backend psql -U postgres -d auto-rename-plate-db
```

### Vấn Đề: Frontend Không Tải

#### Lỗi: "index.css not found"
**Giải Pháp:**
```bash
# Rebuild frontend
cd frontend
npm run build

# Hoặc rebuild container
docker-compose up --build autoplate-frontend
```

### Vấn Đề: CORS Error

**Giải Pháp:**
Cập nhật `FRONTEND_URL` trong `.env`:
```dotenv
FRONTEND_URL=http://localhost:3000
```

Restart backend:
```bash
docker-compose restart autoplate-backend
```

### Vấn Đề: Gemini API Không Hoạt Động

**Giải Pháp:**
1. Kiểm tra API Key: `echo $GEMINI_API_KEY`
2. Xác nhận API được bật trong Google Cloud Console
3. Kiểm tra rate limit (free tier: 60 requests/minute)

---

## 🔒 Bảo Mật

### Recommendations cho Production:

1. **JWT Secret:**
   ```bash
   # Generate strong secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS:**
   - Sử dụng reverse proxy (Nginx, Traefik)
   - Cấu hình SSL/TLS certificates

3. **Environment Variables:**
   - Không commit `.env` file
   - Sử dụng secrets management (HashiCorp Vault, AWS Secrets Manager)

4. **Database:**
   - Backup thường xuyên
   - Sử dụng strong passwords
   - Giới hạn network access

5. **API Rate Limiting:**
   - Thêm rate limiter middleware

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs: `docker-compose logs -f`
2. Xem `DEVELOPMENT.md` để biết thêm chi tiết
3. Kiểm tra mã lỗi trong Troubleshooting section

---

## 📝 License

[Thêm license info nếu cần]

---

**Last Updated:** December 4, 2025
