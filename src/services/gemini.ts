import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

export interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function* sendMessageStream(
  history: Message[],
  message: string,
  systemInstruction?: string
) {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const chat = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: systemInstruction || "You are a helpful AI chatbot. Keep your responses concise and friendly.",
    },
    history: history,
  });

  const result = await chat.sendMessageStream({ message });

  for await (const chunk of result) {
    const response = chunk as GenerateContentResponse;
    yield response.text;
  }
}
