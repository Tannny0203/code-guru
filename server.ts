import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import analyzeRouter from "./src/backend/routes/analyze.ts";
import chatRouter from "./src/backend/routes/chat.ts";
import authRouter from "./src/backend/routes/auth.ts";

async function startServer() {
  const errors: string[] = [];

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "paste_your_gemini_key_here") {
    errors.push("  ❌ GEMINI_API_KEY   → get it at https://aistudio.google.com/app/apikey");
  }
  if (!process.env.HINDSIGHT_API_KEY || process.env.HINDSIGHT_API_KEY === "paste_your_hindsight_api_key_here") {
    errors.push("  ❌ HINDSIGHT_API_KEY → get it at https://app.hindsight.vectorize.io");
  }
  if (!process.env.HINDSIGHT_BASE_URL || process.env.HINDSIGHT_BASE_URL === "https://your-instance.hindsight.vectorize.io") {
    errors.push("  ❌ HINDSIGHT_BASE_URL → copy your instance URL from https://app.hindsight.vectorize.io");
  }

  if (errors.length > 0) {
    console.error("\n🔑  Missing API keys in your .env file:\n");
    errors.forEach(e => console.error(e));
    console.error("\n👉  Open .env, paste your keys, save, then run  npm run dev  again.\n");
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.use("/api/analyze", analyzeRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/auth", authRouter);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\n✅  CodeMentor AI is running!");
    console.log(`🌐  Open → http://localhost:${PORT}`);
    console.log("🔑  Gemini + Hindsight keys loaded ✓\n");
  });
}

startServer();
