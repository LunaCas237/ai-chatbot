import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will not work.");
}
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

If the user says "hi" or "hello", you MUST respond exactly with: "hello, welcome to Wallcraft Thailand! I am the official AI assistant for Wallcraft Thailand, ready to provide information about our Custom Digital Print wallpapers and modern premium wallcoverings." followed by the Thai translation.

Your expertise is in Wallcraft Thailand's specific product lines, including:
- Custom Digital Print Wallpapers (วอลเปเปอร์สั่งพิมพ์ระบบดิจิทัล)
- Premium Wallcoverings and Murals
- Specialized materials like Canvas, Leather, and Fabric textures
- Professional installation services and interior decoration solutions

Use Google Search to find specific wallpaper collections, prices, and availability on the Wallcraft Thailand website (https://www.wallcraftthailand.com/) when users ask for specific styles or images.
Keep your responses concise and informative.

When an image is provided:
1. Provide a VERY DETAILED description of the image content, focusing on textures, colors, lighting, and spatial arrangement.
2. If a specific area was selected (cropped), focus your analysis primarily on that region.
3. Suggest suitable Wallcraft wallpaper designs or materials that would complement the scene or match the style in the image.
4. Explain WHY these suggestions work based on the visual elements identified.
5. Provide all this information in both Thai and English as per the standard format.`;

  const contents = history.map(({ role, parts }) => ({
    role,
    parts: parts.map(part => {
      if (part.text) return { text: part.text };
      if (part.inlineData) return { inlineData: part.inlineData };
      return part;
    })
  }));

  const userParts: any[] = [];
  if (message.trim()) {
    userParts.push({ text: `${message} (Reference: https://www.wallcraftthailand.com/)` });
  } else if (image) {
    userParts.push({ text: "What is in this image? (Reference: https://www.wallcraftthailand.com/)" });
  }

  if (image) {
    userParts.push({ inlineData: image });
  }

  if (userParts.length === 0) return;

  contents.push({
    role: "user",
    parts: userParts
  });

  try {
    const result = await genAI.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents,
      config: {
        systemInstruction: systemInstruction || defaultSystemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      },
    });

    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      if (response.text) {
        yield response.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
      yield `Error: ${error.message}`;
    } else {
      yield "An unexpected error occurred while communicating with the AI.";
    }
  }
}
