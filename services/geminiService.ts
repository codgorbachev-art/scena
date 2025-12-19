
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult, GroundingSource } from "../types";
import { stripCodeFences, extractJson } from "../utils";

const SYSTEM_INSTRUCTION = `Ты — элитный бизнес-аналитик и ведущий сценарист. 
ТВОЯ МИССИЯ: Превратить технический запрос в виральный, экспертный контент.
Используй Google Search для поиска ТТХ, цен и отзывов.
ВЕРНИ СТРОГИЙ JSON.`;

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined" || key === "" || key.includes("ваш_ключ")) {
    return null;
  }
  return key;
};

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key не настроен. Пожалуйста, добавьте API_KEY в настройки Vercel.");

  const ai = new GoogleGenAI({ apiKey });
  
  const duration = req.options.durationSec;
  const targetWordCount = Math.floor((duration / 60) * 140);

  const promptParts: any[] = [];
  
  if (Array.isArray(req.input.attachments)) {
    req.input.attachments.forEach(a => {
      promptParts.push({ inlineData: { mimeType: a.mimeType, data: a.dataBase64 } });
    });
  }

  const promptText = `
ОБЪЕКТ: "${req.input.text || "Анализ"}"
ПЛАТФОРМА: ${req.options.platform}
ТАЙМИНГ: ${duration} сек.
СТИЛЬ: ${req.options.style}
ЦЕЛЬ: ${req.options.direction}

ВЕРНИ JSON:
{
  "extractedText": "Анализ рынка и объекта...",
  "titleOptions": ["Заголовок 1"],
  "hookOptions": ["Хук 1"],
  "scriptMarkdown": "Текст...",
  "shots": [{ "t": "00:00", "frame": "Кадр", "onScreenText": "Текст", "voiceOver": "Диктор", "broll": "SFX" }],
  "thumbnailIdeas": ["Идея 1"],
  "hashtags": ["Тег"],
  "checklist": ["Совет"]
}
  `.trim();

  promptParts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: promptParts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 31000 },
      tools: [{ googleSearch: {} }]
    }
  });

  const rawText = response.text || "{}";
  const result = JSON.parse(extractJson(stripCodeFences(rawText))) as GenerateResult;

  const sources: GroundingSource[] = [];
  const candidates = response.candidates;
  
  if (candidates && candidates.length > 0) {
    const groundingMetadata = candidates[0].groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        const title = chunk?.web?.title;
        const uri = chunk?.web?.uri;
        if (title && uri) {
          sources.push({ title, uri });
        }
      });
    }
  }

  return { ...result, sources: sources.length > 0 ? sources : undefined };
}

export async function generateThumbnailVisual(idea: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key не настроен.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: `Cinematic commercial photography: ${idea}` }] }],
    config: {
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
    }
  });

  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    const candidate = candidates[0];
    const parts = candidate.content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        const data = part.inlineData?.data;
        if (data) {
          return `data:image/png;base64,${data}`;
        }
      }
    }
  }
  
  throw new Error("Не удалось извлечь изображение из ответа модели.");
}
