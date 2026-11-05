function parsePasswordEnrollmentTokens(): Record<string, string> {
  const raw = process.env.PASSWORD_ENROLLMENT_TOKENS;
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("PASSWORD_ENROLLMENT_TOKENS must be a JSON object");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("PASSWORD_ENROLLMENT_TOKENS must be a JSON object");
  }

  const tokens: Record<string, string> = Object.create(null);
  for (const [email, token] of Object.entries(parsed)) {
    if (typeof token !== "string" || token.length < 32) {
      throw new Error("PASSWORD_ENROLLMENT_TOKENS values must be at least 32 characters");
    }
    tokens[email.trim().toLowerCase()] = token;
  }
  return tokens;
}

export const ENV = {
  appId: process.env.VITE_APP_ID || "divine-nexus",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: (process.env.OWNER_EMAIL ?? "").trim().toLowerCase(),
  passwordEnrollmentTokens: parsePasswordEnrollmentTokens(),
  trustedProxies: (process.env.TRUST_PROXY ?? "")
    .split(",")
    .map((proxy) => proxy.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
  llmApiUrl: process.env.LLM_API_URL || "https://api.groq.com/openai/v1",
  llmApiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
