import { Router } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

enum PlateColor {
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  OTHER = 'other',
}

enum Viewpoint {
  FRONT = 'front',
  REAR = 'rear',
  UNKNOWN = 'unknown',
}

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    plateNumber: {
      type: Type.STRING,
      description: "The license plate character string. Alphanumeric only, no spaces, hyphens, or dots. Convert to Uppercase.",
    },
    plateColor: {
      type: Type.STRING,
      enum: [PlateColor.WHITE, PlateColor.YELLOW, PlateColor.BLUE, PlateColor.OTHER],
      description: "The dominant background color of the license plate.",
    },
    viewpoint: {
      type: Type.STRING,
      enum: [Viewpoint.FRONT, Viewpoint.REAR, Viewpoint.UNKNOWN],
      description: "Whether the image shows the front or the rear of the car.",
    },
  },
  required: ["plateNumber", "plateColor", "viewpoint"],
};

// Analyze car image
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Data or mimeType' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analyze this image of a car. 
            1. Identify the license plate number. Ensure it is only alphanumeric characters (A-Z, 0-9). Remove any dots, dashes, or spaces.
            2. Identify the background color of the license plate (White, Yellow, Blue, or Other).
            3. Identify if the image shows the FRONT or REAR of the car.
            Return the result in JSON format.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    const result = JSON.parse(text);
    res.json(result);

  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

export default router;
