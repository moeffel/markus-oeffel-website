import { NextResponse } from "next/server";

import { ingestRagCorpus } from "@/lib/rag/ingest";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/security/hmac";

function signatureFromRequest(request: Request): string | null {
  return (
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-signature") ??
    null
  );
}

export async function POST(request: Request) {
  const allowUnsafeDev =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_UNSAFE_REINDEX === "1";

  const secret = process.env.WEBHOOK_HMAC_SECRET;
  if (!secret && !allowUnsafeDev) {
    return NextResponse.json(
      { error: "missing_webhook_secret" },
      { status: 500 },
    );
  }

  if (!allowUnsafeDev) {
    const signature = signatureFromRequest(request);
    if (!signature) {
      return NextResponse.json({ error: "missing_signature" }, { status: 401 });
    }

    const rawBody = await request.text().catch(() => "");
    const expected = hmacSha256Hex(secret!, rawBody);
    if (!timingSafeEqualHex(signature, expected)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  } else {
    await request.text().catch(() => "");
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "missing_openai_key" }, { status: 500 });
  }
  if (!process.env.SUPABASE_DB_URL && !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "missing_db_url" }, { status: 500 });
  }

  const report = await ingestRagCorpus();
  return NextResponse.json(report);
}
