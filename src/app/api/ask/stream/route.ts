import { NextResponse } from "next/server";
import { z } from "zod";

import type { AskCitation, AskResponse, AskSuggestedLink } from "@/lib/ask/answer";
import { answerFromCorpus, answerFromCorpusWithLlm } from "@/lib/ask/answer";
import { buildAskPrompt } from "@/lib/ask/prompt";
import { openAiChatCompletionStream } from "@/lib/ai/openai";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { retrieveRagContext } from "@/lib/rag/retrieval";
import { isTurnstileSecretConfigured, verifyTurnstile } from "@/lib/security/turnstile";

const askSchema = z.object({
  query: z.string().trim().min(1).max(1000),
  lang: z.enum(["de", "en"]),
  session_id: z.string().trim().max(200).optional(),
  captcha_token: z.string().trim().optional(),
});

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function getAskDailyLimit(): number | null {
  const explicit = parsePositiveInt(process.env.ASK_DAILY_LIMIT);
  if (explicit) return explicit;

  const budget = Number(process.env.ASK_DAILY_BUDGET_USD);
  if (!Number.isFinite(budget) || budget <= 0) return null;

  const estimatedCost = Number(process.env.ASK_ESTIMATED_COST_USD ?? "0.01");
  if (!Number.isFinite(estimatedCost) || estimatedCost <= 0) return null;

  return Math.max(1, Math.floor(budget / estimatedCost));
}

type NdjsonEvent =
  | { type: "meta"; citations: AskCitation[]; suggested_links: AskSuggestedLink[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

function toNdjson(event: NdjsonEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

async function streamFromFinalAnswer(input: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  answer: string;
}) {
  const text = input.answer ?? "";
  const step = 48;
  for (let i = 0; i < text.length; i += step) {
    input.controller.enqueue(toNdjson({ type: "delta", text: text.slice(i, i + step) }));
    // allow the browser to paint between chunks
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function tryVectorRag(input: {
  query: string;
  lang: "de" | "en";
}): Promise<{
  citations: AskCitation[];
  suggested_links: AskSuggestedLink[];
  sources: string;
} | null> {
  const ctx = await retrieveRagContext({
    query: input.query,
    lang: input.lang,
    visibilities: ["public", "private"],
  }).catch(() => null);

  if (!ctx || ctx.chunks.length === 0) return null;

  const yearTokens = Array.from(
    new Set(input.query.match(/\b(?:19|20)\d{2}\b/g) ?? []),
  );
  if (yearTokens.length > 0) {
    const hasYearCoverage = ctx.chunks.some((chunk) =>
      yearTokens.some((year) =>
        `${chunk.title}\n${chunk.section_id}\n${chunk.content}`.includes(year),
      ),
    );
    if (!hasYearCoverage) return null;
  }

  return { citations: ctx.citations, suggested_links: ctx.suggested_links, sources: ctx.sources };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit({ key: `ask:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  if (isTurnstileSecretConfigured()) {
    if (!parsed.data.captcha_token) {
      return NextResponse.json({ error: "captcha_required" }, { status: 400 });
    }
    const verify = await verifyTurnstile({
      token: parsed.data.captcha_token,
      ip: ip !== "unknown" ? ip : undefined,
    });
    if (!verify.ok) {
      return NextResponse.json(
        { error: "captcha_invalid", codes: verify.errorCodes },
        { status: 400 },
      );
    }
  }

  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const llmEnabled = parseBooleanEnv(process.env.ASK_ENABLE_LLM, false);
  const vectorEnabled = parseBooleanEnv(process.env.ASK_ENABLE_VECTOR_RAG, false);
  const useLlm = hasOpenAiKey && llmEnabled;
  const hasDbUrl = Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
  const vectorRagReady = useLlm && vectorEnabled && hasDbUrl;

  if (useLlm) {
    const dailyLimit = getAskDailyLimit();
    if (dailyLimit) {
      const keyBase = parsed.data.session_id
        ? `ask:daily:${ip}:${parsed.data.session_id}`
        : `ask:daily:${ip}`;
      const daily = await rateLimit({
        key: keyBase,
        limit: dailyLimit,
        windowMs: 86_400_000,
      });
      if (!daily.ok) {
        const retryAfterSeconds = Math.max(
          0,
          Math.ceil((daily.resetAt - Date.now()) / 1000),
        );
        return NextResponse.json(
          { error: "budget_exceeded" },
          {
            status: 503,
            headers: { "retry-after": String(retryAfterSeconds) },
          },
        );
      }
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!useLlm) {
          const result = await answerFromCorpus({
            query: parsed.data.query,
            lang: parsed.data.lang,
          });
          controller.enqueue(
            toNdjson({
              type: "meta",
              citations: result.citations,
              suggested_links: result.suggested_links,
            }),
          );
          await streamFromFinalAnswer({ controller, answer: result.answer });
          controller.enqueue(toNdjson({ type: "done" }));
          controller.close();
          return;
        }

        if (vectorRagReady) {
          try {
            const ctx = await tryVectorRag({
              query: parsed.data.query,
              lang: parsed.data.lang,
            });

            if (ctx) {
              controller.enqueue(
                toNdjson({
                  type: "meta",
                  citations: ctx.citations,
                  suggested_links: ctx.suggested_links,
                }),
              );

              const prompt = buildAskPrompt({
                lang: parsed.data.lang,
                query: parsed.data.query,
                sources: ctx.sources,
              });

              for await (const delta of openAiChatCompletionStream({
                system: prompt.system,
                user: prompt.user,
                temperature: 0.2,
                maxTokens: Number(process.env.ASK_MAX_TOKENS ?? 450),
              })) {
                controller.enqueue(toNdjson({ type: "delta", text: delta }));
              }

              controller.enqueue(toNdjson({ type: "done" }));
              controller.close();
              return;
            }
          } catch (err) {
            console.error("[ask/stream] vector rag failed; falling back.", err);
          }
        }

        // Fallback: corpus (+ optional LLM) but still stream the output.
        const fallback: AskResponse = useLlm
          ? await answerFromCorpusWithLlm({
              query: parsed.data.query,
              lang: parsed.data.lang,
            })
          : await answerFromCorpus({
              query: parsed.data.query,
              lang: parsed.data.lang,
            });

        controller.enqueue(
          toNdjson({
            type: "meta",
            citations: fallback.citations,
            suggested_links: fallback.suggested_links,
          }),
        );
        await streamFromFinalAnswer({ controller, answer: fallback.answer });
        controller.enqueue(toNdjson({ type: "done" }));
        controller.close();
      } catch (err) {
        console.error("[ask/stream] fatal error", { ip, err });
        controller.enqueue(toNdjson({ type: "error", error: "provider_error" }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-accel-buffering": "no",
    },
  });
}
