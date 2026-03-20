export interface AnalysisResult {
  feedback: string;
  memories: string[];
  weakAreas: string[];
  language: string;
}

export interface UserStats {
  totalAnalyses: number;
  languages: string[];
  history: any[];
}

// Get token from localStorage
function getToken() {
  return localStorage.getItem("codementor_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function analyzeCode(code: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/analyze", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.details || err.error || "Failed to analyze code");
  }
  return response.json();
}

export async function getUserStats(): Promise<UserStats> {
  const response = await fetch("/api/analyze/stats", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function generateChallenge(stats: UserStats): Promise<string> {
  const response = await fetch("/api/analyze/challenge", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ languages: stats.languages, totalAnalyses: stats.totalAnalyses }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.details || err.error || "Failed to generate challenge");
  }
  const data = await response.json();
  return data.challenge;
}
