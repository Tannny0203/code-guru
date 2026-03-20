import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro-latest",
];

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey: key });
}

const SYSTEM_INSTRUCTION = `You are CodeBot, an expert AI coding assistant inside CodeGuru.
You help developers with debugging, writing code, explaining concepts, best practices, and code reviews.
Be concise, friendly, and always format code with proper markdown code blocks with language specified.`;

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAI();
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];

    let lastError: any;
    for (const model of MODELS) {
      try {
        const chat = ai.chats.create({ model, config: { systemInstruction: SYSTEM_INSTRUCTION }, history });
        const response = await chat.sendMessage({ message: lastMessage.content });
        console.log(`[gemini chat] Used model: ${model}`);
        return res.json({ reply: response.text ?? "Sorry, I couldn't generate a response." });
      } catch (err: any) {
        if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
          console.warn(`[gemini chat] ${model} quota exceeded, trying next...`);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw new Error(`All models quota exceeded. Try again later.\n${lastError?.message}`);
  } catch (error: any) {
    console.error("[/chat]", error);
    res.status(500).json({ error: "Chat failed", details: error.message });
  }
});

export default router;
