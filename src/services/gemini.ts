import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

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
}

export async function* sendMessageStream(
  history: Message[],
  message: string,
  image?: { mimeType: string; data: string },
  systemInstruction?: string
) {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const defaultSystemInstruction = `You are a helpful AI assistant. 
Your primary language is Thai. 
For every response, you MUST provide the answer in Thai first, followed by a clear English translation.
Format your response like this:
[Thai Response]
---
[English Translation]

If the user provides an image, analyze it and answer their questions about it in both languages.`;

  const chat = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: systemInstruction || defaultSystemInstruction,
    },
    history: history,
  });

  const parts: MessagePart[] = [{ text: message }];
  if (image) {
    parts.push({ inlineData: image });
  }

  const result = await chat.sendMessageStream({ message: parts as any });

  for await (const chunk of result) {
    const response = chunk as GenerateContentResponse;
    yield response.text;
  }
}
