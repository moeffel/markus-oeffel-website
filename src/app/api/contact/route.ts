import { NextResponse } from "next/server";
import { z } from "zod";

import { sendContactEmail } from "@/lib/contact/resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  isTurnstileSecretConfigured,
  verifyTurnstile,
} from "@/lib/security/turnstile";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
  company: z.string().trim().max(180).optional(),
  intent: z.enum(["employer", "client", "other"]).optional(),
  captcha_token: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `contact:${ip}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const captchaRequired =
    isTurnstileSecretConfigured() && rl.remaining <= 7;

  if (captchaRequired && !parsed.data.captcha_token) {
    return NextResponse.json({ error: "captcha_required" }, { status: 400 });
  }

  if (captchaRequired && parsed.data.captcha_token) {
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

  // PII policy: do not log raw email/message in production.
  console.info("[contact] received", {
    ip,
    intent: parsed.data.intent ?? null,
    hasCompany: Boolean(parsed.data.company),
    messageLength: parsed.data.message.length,
  });

  const sent = await sendContactEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    company: parsed.data.company,
    intent: parsed.data.intent,
    ip,
  });

  if (!sent.ok) {
    console.error("[contact] provider_error", {
      ip,
      intent: parsed.data.intent ?? null,
      reason: sent.error,
      detail: sent.detail ?? null,
    });

    if (
      sent.error === "provider_not_configured" ||
      sent.error === "missing_contact_to"
    ) {
      return NextResponse.json(
        { error: "provider_not_configured" },
        { status: 503 },
      );
    }

    const exposeProviderDetail = process.env.CONTACT_DEBUG_ERRORS === "1";
    if (exposeProviderDetail) {
      return NextResponse.json(
        { error: "provider_error", detail: sent.detail ?? null },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    provider: sent.provider,
    captcha: captchaRequired ? "used" : "not_required",
  });
}
