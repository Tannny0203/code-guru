// Hindsight memory — with per-user isolation
// Uses real Hindsight Cloud if keys are set, otherwise falls back to in-memory store

interface Memory {
  id: string;
  userId: string;
  content: string;
  metadata?: any;
}

// ── In-memory fallback (per-user Map) ─────────────────────────────────────────
const memoryStore = new Map<string, Memory[]>();

function getUserMemories(userId: string): Memory[] {
  if (!memoryStore.has(userId)) memoryStore.set(userId, []);
  return memoryStore.get(userId)!;
}

const inMemoryHindsight = {
  async create(data: { userId: string; content: string; metadata?: any }) {
    const memory: Memory = { id: Date.now().toString() + Math.random(), ...data };
    getUserMemories(data.userId).push(memory);
    return memory;
  },
  async search(params: { userId: string; query: string; topK?: number }) {
    // Return most recent memories for this user only
    const mems = getUserMemories(params.userId);
    return mems.slice(-(params.topK ?? 5)).reverse();
  },
  async getAll(userId: string) {
    return getUserMemories(userId);
  },
};

// ── Real Hindsight Cloud ───────────────────────────────────────────────────────
function useRealHindsight(): boolean {
  const key = process.env.HINDSIGHT_API_KEY;
  const url = process.env.HINDSIGHT_BASE_URL;
  return !!(
    key && key !== "paste_your_hindsight_api_key_here" &&
    url && url !== "https://your-instance.hindsight.vectorize.io"
  );
}

function bankId(userId: string) {
  return `codementor-user-${userId}`;
}

async function getRealClient() {
  const { HindsightClient } = await import("@vectorize-io/hindsight-client");
  return new HindsightClient({
    baseUrl: process.env.HINDSIGHT_BASE_URL!,
    apiKey: process.env.HINDSIGHT_API_KEY!,
  });
}

// ── Unified export — auto-picks real or fallback ──────────────────────────────
export const hindsight = {
  memory: {
    async create(data: { userId: string; content: string; metadata?: any }) {
      if (useRealHindsight()) {
        try {
          const client = await getRealClient();
          await client.retain(bankId(data.userId), data.content);
          return { id: Date.now().toString(), ...data };
        } catch (e) {
          console.warn("[hindsight] Real client failed, using in-memory:", e);
        }
      }
      return inMemoryHindsight.create(data);
    },

    async search(params: { userId: string; query: string; topK?: number; filter?: any }) {
      if (useRealHindsight()) {
        try {
          const client = await getRealClient();
          const results = await client.recall(bankId(params.userId), params.query);
          const items = results?.results ?? [];
          return items.slice(0, params.topK ?? 5).map((r: any) => ({
            id: r.id ?? "",
            content: r.text ?? r.content ?? "",
            metadata: r.metadata ?? {},
          }));
        } catch (e) {
          console.warn("[hindsight] Real client failed, using in-memory:", e);
        }
      }
      return inMemoryHindsight.search(params);
    },

    async getAll(userId: string) {
      if (useRealHindsight()) {
        try {
          const client = await getRealClient();
          const results = await client.recall(bankId(userId), "code analysis feedback mistakes");
          const items = results?.results ?? [];
          return items.map((r: any) => ({
            id: r.id ?? "",
            userId,
            content: r.text ?? r.content ?? "",
            metadata: r.metadata ?? {},
          }));
        } catch (e) {
          console.warn("[hindsight] Real client failed, using in-memory:", e);
        }
      }
      return inMemoryHindsight.getAll(userId);
    },
  },
};
