import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Universal Gemini API key detection.
 * Works in:
 * 1. AI Studio (Vite)
 * 2. Next.js (.env.local)
 * 3. Vite (.env)
 * 4. Custom environments
 */
const getApiKey = () => {
  const isInvalid = (k: any) => 
    !k || 
    typeof k !== 'string' || 
    k.trim() === "" || 
    k === "undefined" || 
    k === "null" || 
    k.includes("YOUR_") || 
    k.includes("INSERT_");

  // Check process.env (Next.js or Node-like environments)
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                (process.env as any).VITE_GEMINI_API_KEY;
    if (!isInvalid(key)) return key;
  }
  
  // Check import.meta.env (Vite standard)
  try {
    // @ts-ignore
    const env = import.meta.env;
    if (env) {
      const key = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
      if (!isInvalid(key)) return key;
    }
  } catch (e) {}

  return "";
};

const defaultApiKey = getApiKey();

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  role: "user" | "model";
  parts: MessagePart[];
  timestamp?: string;
}

export async function* sendMessageStream(
  history: Message[],
  message: string,
  image?: { mimeType: string; data: string },
  systemInstruction?: string,
  customApiKey?: string
) {
  const finalApiKey = customApiKey || defaultApiKey;
  
  if (!finalApiKey || finalApiKey === "undefined" || finalApiKey.trim() === "") {
    throw new Error(
      "Gemini API key not found. \n\n" +
      "1. If using AI Studio: Add GEMINI_API_KEY to 'Secrets'. \n" +
      "2. If using Next.js: Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file. \n" +
      "3. If using Vite: Add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  const aiClient = new GoogleGenAI({ apiKey: finalApiKey });

  const contents = history.map(({ role, parts }) => ({
    role,
    parts: parts.map(p => {
      if (p.text) return { text: p.text };
      if (p.inlineData) return { inlineData: p.inlineData };
      return p;
    }),
  }));

  const userParts: any[] = [];
  if (message.trim()) userParts.push({ text: message });
  if (image) userParts.push({ inlineData: image });

  contents.push({ role: "user", parts: userParts });

  try {
    const stream = await aiClient.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: systemInstruction || "You are the official AI assistant for Wallcraft Thailand.",
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      const response = chunk as GenerateContentResponse;
      if (response.text) {
        yield response.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    let errorMessage = "Unknown error";
    
    // Try to parse structured error message
    try {
      if (typeof error?.message === 'string') {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed?.error?.message || parsed?.message || error.message;
      } else {
        errorMessage = error?.message || "Unknown error";
      }
    } catch (e) {
      errorMessage = error?.message || "Unknown error";
    }

    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not valid")) {
      yield `❌ **Invalid API Key**: The API key being used is not valid. 

**How to fix:**
1. Generate a new key at [aistudio.google.com](https://aistudio.google.com/app/apikey).
2. If using AI Studio, add it to the **Secrets** menu as \`GEMINI_API_KEY\`.
3. If using your own website, paste it into the **Settings (gear icon)** fallback field temporarily to test.`;
    } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      yield `⚠️ **Quota Exceeded**: You've hit the Gemini API rate limit. Please wait a moment or use a different API key.`;
    } else {
      yield `I encountered an error: ${errorMessage}. Please verify your API key and configuration.`;
    }
  }
}
