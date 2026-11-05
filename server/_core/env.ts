export const ENV = {
  appId: process.env.VITE_APP_ID || "divine-nexus",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: (process.env.OWNER_EMAIL ?? "").trim().toLowerCase(),
  isProduction: process.env.NODE_ENV === "production",
  llmApiUrl: process.env.LLM_API_URL || "https://api.groq.com/openai/v1",
  llmApiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
