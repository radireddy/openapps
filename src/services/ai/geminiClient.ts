import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

export function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Set API_KEY in your .env file.");
  }
  return apiKey;
}

export function createAIClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

export function getModelName(): string {
  return MODEL_NAME;
}

export async function generateStructuredContent(config: {
  systemInstruction: string;
  prompt: string;
  responseSchema?: any;
}): Promise<any> {
  const ai = createAIClient();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: config.prompt,
    config: {
      systemInstruction: config.systemInstruction,
      responseMimeType: "application/json",
      ...(config.responseSchema ? { responseSchema: config.responseSchema } : {}),
      temperature: 0,
    },
  });

  const jsonText = response.text;
  if (!jsonText) {
    throw new Error("AI returned an empty response. The model may have refused to generate content.");
  }

  let result = JSON.parse(jsonText.trim());

  // Handle double-stringified JSON from Gemini
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch {
      throw new Error("AI returned malformed JSON response.");
    }
  }

  return result;
}
