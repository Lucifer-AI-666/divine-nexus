import { describe, it, expect } from "vitest";

describe("Groq API Configuration", () => {
  it("should have GROQ_API_KEY set", () => {
    const apiKey = process.env.GROQ_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^gsk_/); // Groq keys start with gsk_
  });

  it("should be able to call Groq API with valid key", async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: "Rispondi con una sola parola: ciao",
          },
        ],
        max_tokens: 10,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices[0]?.message?.content).toBeTruthy();
  }, { timeout: 10000 });
});
