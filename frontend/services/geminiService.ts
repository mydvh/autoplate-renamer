import { AnalysisResult, PlateColor, Viewpoint } from "../types";
import { apiService } from "./apiService";

export const analyzeCarImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const result = await apiService.analyzeImage(base64Data, mimeType);
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:image/jpeg;base64," part
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
