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
  timestamp?: string;
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

  const defaultSystemInstruction = `You are the official AI assistant for Wallcraft Thailand (https://www.wallcraftthailand.com/). 
Your primary language is Thai. 
For every response, you MUST provide the answer in Thai first, followed by a clear English translation.
Format your response like this:
[Thai Response]
---
[English Translation]

Your expertise is in Wallcraft Thailand's specific product lines, including:
- Custom Digital Print Wallpapers (วอลเปเปอร์สั่งพิมพ์ระบบดิจิทัล)
- Premium Wallcoverings and Murals
- Specialized materials like Canvas, Leather, and Fabric textures
- Professional installation services and interior decoration solutions

Use the information from https://www.wallcraftthailand.com/ to provide detailed and accurate answers about their collections, materials, and pricing models. 
If the user provides an image, analyze it (e.g., a room photo) and suggest suitable Wallcraft wallpaper designs or materials in both languages.`;

  const chat = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: systemInstruction || defaultSystemInstruction,
      tools: [{ urlContext: {} }],
    },
    history: history,
  });

  const parts: MessagePart[] = [{ text: `${message} (Reference: https://www.wallcraftthailand.com/)` }];
  if (image) {
    parts.push({ inlineData: image });
  }

  const result = await chat.sendMessageStream({ message: parts as any });

  for await (const chunk of result) {
    const response = chunk as GenerateContentResponse;
    yield response.text;
  }
}
