
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MnemonicResponse, Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Robust exponential backoff retry logic for handling transient API errors and rate limits.
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Extract status code from various possible error structures
        const status = error?.status || error?.error?.code || error?.status_code;
        const message = error?.message || (typeof error === 'string' ? error : '');
        const errorBodyString = error?.response?.body ? JSON.stringify(error.response.body) : '';
        
        const isQuotaError = 
          status === 429 || 
          message.includes('429') || 
          message.includes('RESOURCE_EXHAUSTED') ||
          message.toLowerCase().includes('quota exceeded') ||
          errorBodyString.includes('429') ||
          errorBodyString.includes('RESOURCE_EXHAUSTED');

        const isServerError = 
          (status >= 500 && status < 600) || 
          message.includes('500') || 
          message.includes('503');

        if (isQuotaError || isServerError) {
          if (attempt < maxRetries) {
            // Increased delay: 3s, 7s, 15s, 31s... to better handle strict quotas
            const delay = (Math.pow(2, attempt + 1) - 1) * 2000 + Math.random() * 1000;
            console.warn(`Retrying after error ${status || 'unknown'} (Attempt ${attempt + 1}/${maxRetries}) in ${Math.round(delay)}ms. Message: ${message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }

  async checkSpelling(word: string): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Correct the spelling of the following English word: "${word}". 
        Return ONLY the corrected word. If the word is already correct, return it as is. 
        Do not include any punctuation or explanations.`,
        config: {
          thinkingConfig: { thinkingLevel: "LOW" }
        }
      });

      const corrected = response.text?.trim().toLowerCase().replace(/[^a-z]/g, '');
      return corrected || word.toLowerCase();
    });
  }

  async getMnemonic(word: string, targetLanguage: Language): Promise<MnemonicResponse> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a mnemonic for the English word "${word}" for a ${targetLanguage} speaker.`,
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
              synonyms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of 3-5 synonyms in English with their translations"
              },
              level: { 
                  type: Type.STRING, 
                  description: "CEFR level of the word (Beginner, Pre-Intermediate, Intermediate, Advanced)" 
              },
              imagePrompt: { type: Type.STRING, description: "Detailed visual description for an image generation AI" }
            },
            required: ["word", "transcription", "meaning", "morphology", "imagination", "phoneticLink", "connectorSentence", "examples", "synonyms", "level", "imagePrompt"]
          },
          systemInstruction: `You are a world-class Mnemonics and English Teacher, specializing in the "Keyword Method" developed by Raugh and Atkinson at Stanford.
          
          Your task is to help users memorize English words using the two-stage mnemonic procedure:
          1. ACOUSTIC LINK (phoneticLink): Find a word or short phrase in ${targetLanguage} that sounds as much as possible like a part (not necessarily all) of the English word. This is the "keyword".
          2. IMAGERY LINK (imagination): Create a vivid, memorable mental image where the "keyword" INTERACTS in a graphic, funny, or even illogical way with the English word's meaning.
          
          CRITICAL RULES:
          1. All explanatory fields (meaning, morphology, imagination, phoneticLink, connectorSentence) MUST be written EXCLUSIVELY in the ${targetLanguage} language.
          2. The "word" field should remain the original English word.
          3. The "examples" field should contain English sentences with their ${targetLanguage} translations.
          4. The "synonyms" field should contain 3-5 English synonyms followed by their ${targetLanguage} translations in parentheses.
          5. You MUST return a valid JSON object matching the schema.
          
          Structure for ${targetLanguage} content:
          - meaning: Clear translation in ${targetLanguage}.
          - imagination: The "Imagery Link". Describe a scene where the keyword and the meaning interact vividly.
          - phoneticLink: The "Acoustic Link". Identify the keyword in ${targetLanguage} and explain how it sounds like the English word.
          - connectorSentence: A catchy 1-sentence summary in ${targetLanguage} that ties the keyword and meaning together.`
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      return JSON.parse(text);
    });
  }

  async generateImage(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Vibrant, clear, high-quality educational cartoon illustration of: ${prompt}. No text in image.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
          }
        }
      }
      return '';
    });
  }

  async generateTTS(text: string, targetLanguage: Language): Promise<string> {
    return this.withRetry(async () => {
      // New instance per call is safer for diverse environments
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `Read the following text aloud. It contains English words and their explanation in ${targetLanguage}. 
            Please use a clear, standard English accent for the English words and a natural, fluent ${targetLanguage} accent for the rest of the text.
            Text: "${text}"` 
          }] 
        }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      
      console.error("TTS Response missing audio parts:", response);
      return '';
    });
  }
}