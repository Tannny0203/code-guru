import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { hindsight } from "../hindsight.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

// Free tier models as of 2026 (only Gemini 2.5 family is available on free tier)
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-2.5-pro",
];

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey: key });
}

// Try each model in order, retrying on any API/availability error
async function generateWithFallback(ai: GoogleGenAI, contents: string, systemInstruction: string): Promise<string> {
  let lastError: any;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction },
      });
      console.log(`[gemini] Used model: ${model}`);
      return response.text ?? "No feedback generated.";
    } catch (err: any) {
      const status = err?.status ?? err?.code ?? 0;
      const msg = (err?.message ?? "").toLowerCase();

      // Always skip to next model on these HTTP statuses
      const isRetryable =
        status === 429 ||
        status === 503 ||
        status === 503 ||
        status === 500 ||
        status === 404 ||
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("404") ||
        msg.includes("quota") ||
        msg.includes("resource_exhausted") ||
        msg.includes("unavailable") ||
        msg.includes("not found") ||
        msg.includes("not_found") ||
        msg.includes("high demand") ||
        msg.includes("overloaded");

      console.warn(`[gemini] ${model} failed (status=${status}): ${err?.message?.slice(0, 120)}`);
      lastError = err;

      if (isRetryable) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      // For unknown errors, still try next model instead of hard crashing
      console.warn(`[gemini] Unknown error on ${model}, trying next anyway...`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`All Gemini models failed. Please try again later.\n\nLast error: ${lastError?.message}`);
}

function detectLanguage(code: string): string {
  if (code.includes("import React") || code.includes("export default function")) return "React/TSX";
  if (code.includes("def ") && (code.includes("import pandas") || code.includes("print("))) return "Python";
  if (code.includes("public class") || code.includes("System.out.println")) return "Java";
  if (code.includes("function") || code.includes("const ") || code.includes("let ")) return "JavaScript";
  return "Unknown";
}

// Analyze
router.post("/analyze", async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const ai = getAI();
    const language = detectLanguage(code);

    const rawMemories = await hindsight.memory.search({ userId, query: code, topK: 5 });
    const memories = rawMemories.map((m) => m.content);

    const memoryContext = memories.length > 0
      ? memories.map((m: string) => `- ${m}`).join("\n")
      : "No past mistakes found in memory.";

    const systemInstruction = `You are a coding mentor. 
Use the user's past mistakes from memory to personalize feedback. 
If the user repeats a mistake, explicitly mention it.
Language detected: ${language}
Past Mistakes Context:\n${memoryContext}`;

    const feedback = await generateWithFallback(
      ai,
      `Please analyze the following code and identify any errors or areas for improvement:\n\n\`\`\`\n${code}\n\`\`\``,
      systemInstruction
    );

    await hindsight.memory.create({
      userId,
      content: `Code: ${code.substring(0, 100)}... Feedback: ${feedback.substring(0, 200)}...`,
      metadata: { language, type: "analysis", timestamp: new Date().toISOString() },
    });

    res.json({ feedback, memories, weakAreas: ["Syntax", "Logic", "Efficiency"], language });
  } catch (error: any) {
    console.error("[/analyze/analyze]", error);
    res.status(500).json({ error: "Failed to analyze code", details: error.message });
  }
});

// Stats
router.get("/stats", async (req, res) => {
  try {
    const userId = (req as any).userId;
    const allMemories = await hindsight.memory.getAll(userId);
    const languages = new Set<string>();
    allMemories.forEach((m) => { if (m.metadata?.language) languages.add(m.metadata.language); });
    res.json({
      totalAnalyses: allMemories.length,
      languages: Array.from(languages),
      history: allMemories.slice(-10).reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch stats", details: error.message });
  }
});

// Challenge
router.post("/challenge", async (req, res) => {
  try {
    const ai = getAI();
    const { languages = [], totalAnalyses = 0 } = req.body;
    const prompt = `Based on the user's history:
Languages used: ${languages.join(", ") || "None yet"}
Total analyses: ${totalAnalyses}
Generate a personalized coding challenge that targets their common mistakes or expands their knowledge. 
Provide the challenge with a title, description, and constraints.`;

    const challenge = await generateWithFallback(ai, prompt, "You are a coding challenge generator. Create engaging and educational challenges.");
    res.json({ challenge });
  } catch (error: any) {
    console.error("[/analyze/challenge]", error);
    res.status(500).json({ error: "Failed to generate challenge", details: error.message });
  }
});

export default router;