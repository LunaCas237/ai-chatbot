import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message, image, systemInstruction } = req.body;

      // Check for custom key first, then fallback to default
      const apiKey = process.env.MY_GEMINI_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.includes("TODO")) {
        return res.status(401).json({ 
          error: "Gemini API key is missing or invalid. Please add a secret named 'MY_GEMINI_KEY' in 'Settings > Secrets' with your API key from aistudio.google.com." 
        });
      }

      const genAI = new GoogleGenAI({ apiKey });

      const contents = history.map((msg: any) => ({
        role: msg.role,
        parts: msg.parts.map((part: any) => {
          if (part.text) return { text: part.text };
          if (part.inlineData) return { inlineData: part.inlineData };
          return part;
        })
      }));

      const userParts: any[] = [];
      if (message.trim()) {
        userParts.push({ text: message });
      } else if (image) {
        userParts.push({ text: "What is in this image?" });
      }

      if (image) {
        userParts.push({ inlineData: image });
      }

      contents.push({
        role: "user",
        parts: userParts
      });

      let result;
      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        try {
          result = await genAI.models.generateContentStream({
            model: "gemini-2.0-flash",
            contents,
            config: {
              systemInstruction: systemInstruction,
              tools: [{ googleSearch: {} }],
            }
          });
          break; // Success
        } catch (error: any) {
          const errorMsg = error?.message || "";
          const isRateLimit = errorMsg.includes("429") || error?.status === 429 || errorMsg.includes("quota");
          
          if (isRateLimit && retries < maxRetries) {
            retries++;
            const delay = 10000 * retries; // 10s, 20s, 30s
            console.log(`Rate limit/Quota hit. Retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          if (isRateLimit) {
            return res.status(429).json({ 
              error: "AI Quota Exceeded. The free tier has reached its limit. Please wait about 30-60 seconds before trying again." 
            });
          }
          throw error;
        }
      }

      if (!result) throw new Error("Failed to generate content after retries.");
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(text);
        }
      }
      res.end();

    } catch (error: any) {
      console.error("Server API Error:", error);
      
      const errorMsg = error?.message || "";
      if (errorMsg.includes("API key expired") || errorMsg.includes("API key not valid")) {
        return res.status(401).json({ 
          error: "Your Gemini API key has expired or is invalid. Please generate a new one at aistudio.google.com and update it in 'Settings > Secrets' as 'MY_GEMINI_KEY'." 
        });
      }

      if (errorMsg.includes("429") || error?.status === 429 || errorMsg.includes("quota")) {
        return res.status(429).json({ 
          error: "AI Quota Exceeded. Please wait 60 seconds for the limit to reset." 
        });
      }

      res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
