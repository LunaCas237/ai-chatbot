import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Robust API key detection for both Vite and Next.js
const getApiKey = () => {
  // 1. Check process.env (Works in Next.js and Vite with 'define')
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.GEMINI_API_KEY || 
                process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                (process.env as any).VITE_GEMINI_API_KEY;
    if (key && key !== "undefined") return key;
  }
  
  // 2. Check import.meta.env (Vite standard)
  try {
    // @ts-ignore
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (viteKey && viteKey !== "undefined") return viteKey;
  } catch (e) {
    // Ignore if import.meta is not available
  }

  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

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
  const finalApiKey = customApiKey || apiKey;
  
  if (!finalApiKey || finalApiKey === "undefined") {
    throw new Error("Gemini API key is not configured. Please add GEMINI_API_KEY to the 'Secrets' menu in AI Studio Settings and REFRESH the preview.");
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
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      },
    });

    for await (const chunk of stream) {
      const response = chunk as GenerateContentResponse;
      if (response.text) {
        yield response.text;
      }
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    yield "I encountered an error. Please check your API key in the Secrets menu.";
  }
}
