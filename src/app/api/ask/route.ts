import { NextResponse } from "next/server";
import { z } from "zod";

import { answerFromCorpus, answerFromCorpusWithLlm } from "@/lib/ask/answer";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ragAnswer } from "@/lib/rag/ask";
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

function getAskDailyLimit(): number | null {
  const explicit = parsePositiveInt(process.env.ASK_DAILY_LIMIT);
  if (explicit) return explicit;

  const budget = Number(process.env.ASK_DAILY_BUDGET_USD);
  if (!Number.isFinite(budget) || budget <= 0) return null;

  const estimatedCost = Number(process.env.ASK_ESTIMATED_COST_USD ?? "0.01");
  if (!Number.isFinite(estimatedCost) || estimatedCost <= 0) return null;

  return Math.max(1, Math.floor(budget / estimatedCost));
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
  const hasDbUrl = Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
  const vectorRagReady = hasOpenAiKey && hasDbUrl;

  if (hasOpenAiKey) {
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

  try {
    const fallback = async () =>
      hasOpenAiKey
        ? await answerFromCorpusWithLlm({
            query: parsed.data.query,
            lang: parsed.data.lang,
          })
        : await answerFromCorpus({
            query: parsed.data.query,
            lang: parsed.data.lang,
          });

    let result = vectorRagReady ? await ragAnswer({
      query: parsed.data.query,
      lang: parsed.data.lang,
    }) : await fallback();

    // If the DB is misconfigured/unreachable in local dev, do not hard-fail the page.
    // Fall back to corpus (and optionally LLM) answers.
    if (vectorRagReady && result.citations.length === 0) {
      result = await fallback();
    }

    return NextResponse.json(result);
  } catch (err) {
    // Last resort: if vector RAG fails due to DB issues, try to degrade gracefully.
    if (vectorRagReady) {
      console.error("[ask] rag failed; falling back.", { ip, err });
      try {
        const result = hasOpenAiKey
          ? await answerFromCorpusWithLlm({
              query: parsed.data.query,
              lang: parsed.data.lang,
            })
          : await answerFromCorpus({
              query: parsed.data.query,
              lang: parsed.data.lang,
            });
        return NextResponse.json(result);
      } catch (fallbackErr) {
        console.error("[ask] fallback failed.", { ip, err: fallbackErr });
      }
    } else {
      console.error("[ask] error", { ip, err });
    }

    return NextResponse.json({ error: "provider_error" }, { status: 500 });
  }
}
