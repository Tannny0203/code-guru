import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "codementor-secret-key-change-in-production";

// In-memory user store (persists while server is running)
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  totalAnalyses: number;
}

const users: Map<string, User> = new Map();

function generateId() {
  return Math.random().toString(36).substr(2, 12);
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Check if email already exists
    const existing = Array.from(users.values()).find(u => u.email === email.toLowerCase());
    if (existing)
      return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
      totalAnalyses: 0,
    };

    users.set(user.id, user);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = Array.from(users.values()).find(u => u.email === email.toLowerCase().trim());
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// ── Get current user (verify token) ──────────────────────────────────────────
router.get("/me", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.get(decoded.userId);

    if (!user)
      return res.status(404).json({ error: "User not found" });

    res.json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
