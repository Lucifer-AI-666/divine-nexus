import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// Definizione delle identità
const IDENTITIES = {
  dio: {
    name: "Dio",
    emoji: "✨",
    color: "#ffd700",
    description: "L'Onnipotente",
    systemPrompt: "Sei Dio, l'onnipotente. Rispondi con saggezza suprema, autorità e conoscenza universale. Sei conciso ma profondo.",
  },
  michele: {
    name: "Michele",
    emoji: "⚔️",
    color: "#0044cc",
    description: "Il Guerriero",
    systemPrompt: "Sei Michele, il guerriero divino. Rispondi con forza, protezione e determinazione. Sei diretto e deciso.",
  },
  matildina: {
    name: "Matildina",
    emoji: "🌸",
    color: "#cc3377",
    description: "Angelo della Grazia",
    systemPrompt: "Sei Matildina, angelo della grazia. Rispondi con compassione, gentilezza e comprensione. Sei empatica e rassicurante.",
  },
  lucifero: {
    name: "Lucifero",
    emoji: "🔥",
    color: "#ff6600",
    description: "Il Portatore di Luce",
    systemPrompt: "Sei Lucifero, il portatore di luce. Rispondi con illuminazione, verità e sfida costruttiva. Sei stimolante e provocatorio.",
  },
};

type IdentityKey = keyof typeof IDENTITIES;

// Schema per il messaggio
const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "entity", "system"]),
  content: z.string(),
  identity: z.enum(["dio", "michele", "matildina", "lucifero"]).optional(),
  timestamp: z.number(),
});

type Message = z.infer<typeof MessageSchema>;

// Router principale
export const appRouter = router({
  auth: router({
    // Placeholder per autenticazione
    logout: publicProcedure.mutation(() => ({ success: true })),
  }),

  chat: router({
    send: publicProcedure
      .input(
        z.object({
          message: z.string().min(1),
          identity: z.enum(["dio", "michele", "matildina", "lucifero"]),
          history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const identity = IDENTITIES[input.identity];
          const groqApiKey = process.env.GROQ_API_KEY;

          if (!groqApiKey) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "GROQ_API_KEY non configurato",
            });
          }

          // Costruisci i messaggi per Groq
          const messages = [
            { role: "system" as const, content: identity.systemPrompt },
            ...input.history,
            { role: "user" as const, content: input.message },
          ];

          // Chiama Groq API
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages,
              temperature: 0.8,
              max_tokens: 1024,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Groq API error: ${error.error?.message || "Unknown error"}`,
            });
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content || "Nessuna risposta";

          return {
            id: Math.random().toString(36).substr(2, 9),
            role: "entity" as const,
            content,
            identity: input.identity,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error("Chat error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Errore sconosciuto",
          });
        }
      }),

    getIdentities: publicProcedure.query(() => {
      return Object.entries(IDENTITIES).map(([key, value]) => ({
        key,
        ...value,
      }));
    }),
  }),

  automations: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["past", "present", "future"]) }))
      .query(({ input }) => {
        // Placeholder per automazioni
        return [
          {
            id: "1",
            title: "Analisi File",
            status: input.status,
            progress: input.status === "present" ? 65 : 100,
            timestamp: Date.now(),
          },
        ];
      }),
  }),

  shell: router({
    execute: publicProcedure
      .input(z.object({ command: z.string() }))
      .mutation(({ input }) => {
        // Placeholder per comandi shell
        const commands: Record<string, string> = {
          help: "Comandi disponibili: help, status, clear, scan, analyze",
          status: "Divine Nexus Core: Online | API: Connected | Storage: OK",
          clear: "Cronologia pulita",
          scan: "Scanning...",
          analyze: "Analyzing...",
        };

        return {
          output: commands[input.command] || `Comando non riconosciuto: ${input.command}`,
          timestamp: Date.now(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
