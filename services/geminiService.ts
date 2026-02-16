
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MnemonicResponse, Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getMnemonic(word: string, targetLanguage: Language): Promise<MnemonicResponse> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `"${word}" so'zi uchun ${targetLanguage} tilida mnemonika yarating.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            transcription: { type: Type.STRING },
            meaning: { type: Type.STRING },
            morphology: { type: Type.STRING },
            imagination: { type: Type.STRING },
            phoneticLink: { type: Type.STRING },
            connectorSentence: { type: Type.STRING },
            examples: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            imagePrompt: { type: Type.STRING, description: "DALL-E style prompt for the imagination scene" }
          },
          required: ["word", "transcription", "meaning", "morphology", "imagination", "phoneticLink", "connectorSentence", "examples", "imagePrompt"]
        },
        systemInstruction: `Siz professional "Mnemonika va Ingliz tili ustozi"siz. Sizning vazifangiz foydalanuvchiga xorijiy so‘zlarni bir marta ko‘rganda eslab qolishga yordam beradigan qiziqarli va yorqin mnemonik hikoyalar yaratishdir. DIQQAT: Barcha tushuntirishlar, hikoyalar va misollar MUSTAQIL RAVISHDA ${targetLanguage} tilida bo'lishi shart.`
      },
    });
    return JSON.parse(response.text || '{}');
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A vibrant, funny, high-quality cartoon illustration of the following mnemonic scene: ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
      }
    }
    return '';
  }

  async generateTTS(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this mnemonic in a friendly, encouraging tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  }
}
