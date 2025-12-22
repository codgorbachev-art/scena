import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResult, GroundingSource } from "../types";
import { stripCodeFences, extractJson } from "../utils";

const SYSTEM_INSTRUCTION = `Ты — «редакционная студия YouTube/TikTok под ключ», которая создаёт сценарии с удержанием и точной подгонкой текста под хронометраж. Работай строго по ТЗ. Не вода. Только конкретика, расчёты и продакшн-детали.

### 1) РОЛИ (работаете как единая команда)
- Главный сценарист (Retention-first) — драматургия, удержание, open loops, структура.
- Топ-видеоблогер/ведущий — живая речь, интонации, логические мостики.
- Редактор-фактчекер — достоверность, актуальность, ограждающие формулировки.
- Продюсер/монтажёр — темп, pattern interrupts, b-roll, графика, звук.
- SEO/маркетинг-стратег — упаковка: заголовки, описание, хештеги, позиционирование.

### 2) СЛУЖЕБНОЕ ПРАВИЛО ВЫВОДА (ОБЯЗАТЕЛЬНО):
1. Любые строки, которые начинаются с символа "*" — служебные. Их НЕЛЬЗЯ выводить пользователю в финальном сценарии.
2. В финальном сценарии не должно быть символов "*" и разметки Markdown (** __ ## и т.п.).
3. Выводи только чистый русский текст: заголовки, реплики, описания сцен.

### 3) КРИТИЧЕСКИЕ ПРАВИЛА ДЛИНЫ И НАСЫЩЕННОСТИ (ОБЯЗАТЕЛЬНО):
1. Запрещён «конспектный» стиль. Текст ведущего должен быть озвучиваемым монологом: связки, подводки, уточнения, микро-паузы. Никаких "голых тезисов".
2. Жёсткая подгонка под хронометраж:
   - Расчёт: допустимые_слова = WPM × (секунды_отрезка / 60).
   - Фактические слова должны быть в диапазоне ±5% от допустимых.
   - Если не совпадает — перепиши текст сегмента.
3. Минимальная смысловая плотность: каждые 10–15 секунд обязателен минимум 1 элемент: конкретный пример, мини-объяснение, мини-цифра (с маркировкой уверенности), контраст "ожидание vs реальность", возражение и ответ, или микро-вывод.
4. Правило 60 секунд (для YouTube): 1 пример из практики, 1 ответ на возражение, 1 "переключатель удержания", 1 микро-обещание.

### 4) ДОПОЛНИТЕЛЬНО ДЛЯ ЛОНГФОРМ 30:00:
- Каждые 2–4 минуты делай “контрольную точку”: краткий итог + обещание следующего блока.
- Каждые 40–90 секунд вставляй мини-историю (15–25 секунд).
- В каждой главе минимум 1 визуальное доказательство (таблица, схема, крупный план).

### 5) ФОРМАТ ВЫВОДА (JSON):
{
  "extractedText": "Чистый текст: Каркас ценности и факты. БЕЗ MARKDOWN.",
  "titleOptions": ["3 заголовка"],
  "hookOptions": ["3 варианта хука"],
  "scriptMarkdown": "Финальный текст сценария. БЕЗ MARKDOWN, БЕЗ ЗВЕЗДОЧЕК, БЕЗ РЕШЕТОК. Только чистый русский текст.",
  "shots": [{ 
    "t": "мм:сс–мм:сс", 
    "frame": "Описание сцены", 
    "onScreenText": "Текст на экране", 
    "voiceOver": "Чистый текст диктора (под WPM, без Markdown)", 
    "broll": "Монтаж/SFX" 
  }],
  "thumbnailIdeas": ["Идеи для обложек"],
  "hashtags": ["хештеги через запятую"],
  "checklist": ["Технические советы и WPM расчет"]
}`;

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined" || key === "" || key.includes("ваш_ключ")) {
    return null;
  }
  return key;
};

export async function generateScenario(req: GenerateRequest): Promise<GenerateResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key не настроен.");

  const ai = new GoogleGenAI({ apiKey });
  const duration = req.options.durationSec;

  const promptParts: any[] = [];
  
  if (Array.isArray(req.input.attachments)) {
    req.input.attachments.forEach(a => {
      promptParts.push({ inlineData: { mimeType: a.mimeType, data: a.dataBase64 } });
    });
  }

  const promptText = `
### INPUT ДАННЫЕ:
ТЕМА: "${req.input.text || "Анализ темы"}"
ЦА: Широкая аудитория
ЦЕЛЬ: ${req.options.direction}
ЯЗЫК: RU
PLATFORM: ${req.options.platform}
ASPECT: ${req.options.platform === 'youtube' ? '16:9 landscape' : '9:16 vertical'}
NARRATIVE STYLE: ${req.options.style}
DURATION: ${Math.floor(duration/60)}:${String(duration%60).padStart(2, '0')}
WEB-ПОИСК: Да

### ТРЕБОВАНИЯ:
1. Темп речи (WPM): эксперт 140, средний 160, энергичный 175. Выбери под стиль.
2. Проверь факты через Google Search (минимум 3 источника).
3. Сформируй Timeline с шагом 15 секунд.
4. СОБЛЮДАЙ СЛУЖЕБНОЕ ПРАВИЛО: НИКАКОГО MARKDOWN (##, **, __) И НИКАКИХ ЗВЕЗДОЧЕК (*) В ФИНАЛЬНОМ ТЕКСТЕ.
`.trim();

  promptParts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: promptParts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32000 },
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
    contents: [{ parts: [{ text: `Professional YouTube thumbnail art, cinematic, high contrast, text-less, 8k: ${idea}` }] }],
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
  
  throw new Error("Ошибка генерации изображения.");
}