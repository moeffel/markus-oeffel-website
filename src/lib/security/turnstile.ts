type TurnstileVerifyResult = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
};

export function isTurnstileSecretConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(input: {
  token: string;
  ip?: string;
}): Promise<{ ok: boolean; errorCodes: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, errorCodes: ["missing_secret"] };
    }
    return { ok: true, errorCodes: [] };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", input.token);
  if (input.ip) body.set("remoteip", input.ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    },
  ).catch(() => null);

  if (!res) return { ok: false, errorCodes: ["network_error"] };
  if (!res.ok) return { ok: false, errorCodes: ["http_error"] };

  const json = (await res.json().catch(() => null)) as TurnstileVerifyResult | null;
  if (!json) return { ok: false, errorCodes: ["invalid_json"] };

  return { ok: Boolean(json.success), errorCodes: json["error-codes"] ?? [] };
}

