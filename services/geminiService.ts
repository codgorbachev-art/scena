
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult, GroundingSource } from "../types";
import { stripCodeFences, extractJson } from "../utils";

const SYSTEM_INSTRUCTION = `Ты — элитный бизнес-аналитик и ведущий сценарист. 
ТВОЯ МИССИЯ: Превратить технический запрос в виральный, экспертный контент.
Используй Google Search для поиска ТТХ, цен и отзывов.
ВЕРНИ СТРОГИЙ JSON.`;

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const duration = req.options.durationSec;
  const targetWordCount = Math.floor((duration / 60) * 140);
  const minShots = Math.max(6, Math.ceil(duration / 10));

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
  if (Array.isArray(candidates) && candidates.length > 0) {
    const groundingMetadata = candidates[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk?.web?.title && chunk?.web?.uri) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
  }

  return { ...result, sources: sources.length > 0 ? sources : undefined };
}

export async function generateThumbnailVisual(idea: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: `Cinematic commercial photography: ${idea}` }] }],
    config: {
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
    }
  });

  const candidates = response.candidates;
  if (Array.isArray(candidates) && candidates.length > 0) {
    const candidate = candidates[0];
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  }
  
  throw new Error("Failed to generate image parts.");
}
