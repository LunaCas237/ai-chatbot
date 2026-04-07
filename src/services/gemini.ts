// src/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the VITE_ prefix here
// Update line 5 to this:
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(apiKey);

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
  history: Message[], // This should match your Interface at the top
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

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction || defaultSystemInstruction,
    // Note: googleSearch tool requires specific billing/setup, 
    // remove if you get "tool not found" errors.
  });

  // 2. Start the chat session using the stable startChat method
  const chat = model.startChat({
  history: history.map((msg) => ({
    role: msg.role,
    // Ensure parts is an array and only contains valid SDK properties
    parts: msg.parts.map((p) => {
      const part: any = {};
      if (p.text) part.text = p.text;
      if (p.inlineData) part.inlineData = p.inlineData;
      return part;
    }),
  })),
});
  // 3. Prepare the parts for the new message
  const parts = [];
  if (image) {
    parts.push({ inlineData: image });
  }
  parts.push({ text: `${message} (Reference: https://www.wallcraftthailand.com/)` });

  // 4. Send the message and handle the stream correctly
  const result = await chat.sendMessageStream(parts);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield chunkText;
  } // This closes the 'for' loop
}