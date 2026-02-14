import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type ContactProvider = "resend" | "smtp";
type ContactSendResult =
  | { ok: true; provider: ContactProvider }
  | { ok: false; error: "missing_contact_to" | "provider_not_configured" | "provider_error"; detail?: string };

type ContactMailInput = {
  name: string;
  email: string;
  message: string;
  company?: string;
  intent?: string;
  ip?: string;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function buildSubject(input: ContactMailInput): string {
  return `Portfolio contact${input.intent ? ` (${input.intent})` : ""}: ${input.name}`;
}

function buildBody(input: ContactMailInput): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.company ? `Company: ${input.company}` : null,
    input.intent ? `Intent: ${input.intent}` : null,
    input.ip ? `IP: ${input.ip}` : null,
    "",
    input.message,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendViaResend(input: {
  from: string;
  to: string;
  payload: ContactMailInput;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  if (!resend) return { ok: false, detail: "RESEND_API_KEY missing" };

  const res = await resend.emails
    .send({
      from: input.from,
      to: input.to,
      subject: buildSubject(input.payload),
      replyTo: input.payload.email,
      text: buildBody(input.payload),
    })
    .catch((error) => ({ error }));

  if (!res || (res as any).error) {
    const detail =
      typeof (res as any)?.error?.message === "string"
        ? (res as any).error.message
        : "resend send failed";
    return { ok: false, detail };
  }

  return { ok: true };
}

async function sendViaSmtp(input: {
  from: string;
  to: string;
  payload: ContactMailInput;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!host) return { ok: false, detail: "SMTP_HOST missing" };
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    return { ok: false, detail: "SMTP_PORT invalid" };
  }

  const secure = parseBooleanEnv(process.env.SMTP_SECURE, port === 465);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user || pass ? { auth: { user, pass } } : {}),
  });

  const result = await transporter
    .sendMail({
      from: input.from,
      to: input.to,
      subject: buildSubject(input.payload),
      replyTo: input.payload.email,
      text: buildBody(input.payload),
    })
    .catch((error) => ({ error }));

  if ((result as any)?.error) {
    const detail =
      typeof (result as any).error?.message === "string"
        ? (result as any).error.message
        : "smtp send failed";
    return { ok: false, detail };
  }

  return { ok: true };
}

export async function sendContactEmail(input: ContactMailInput): Promise<ContactSendResult> {
  const to = firstNonEmpty(
    process.env.CONTACT_TO_EMAIL,
    process.env.RESEND_TO_EMAIL,
    process.env.SMTP_TO_EMAIL,
  );
  const allowResendFallbackFrom = parseBooleanEnv(
    process.env.CONTACT_ALLOW_RESEND_ONBOARDING_FROM,
    true,
  );
  const resendFrom = firstNonEmpty(
    process.env.CONTACT_FROM_EMAIL,
    process.env.RESEND_FROM_EMAIL,
    allowResendFallbackFrom ? "onboarding@resend.dev" : "",
  );
  const smtpFrom =
    firstNonEmpty(
      process.env.SMTP_FROM_EMAIL,
      process.env.CONTACT_FROM_EMAIL,
      process.env.RESEND_FROM_EMAIL,
      process.env.SMTP_USER,
    );
  if (!to) return { ok: false, error: "missing_contact_to" };

  const providerOrder: ContactProvider[] = (() => {
    const mode = (process.env.CONTACT_PROVIDER ?? "auto").trim().toLowerCase();
    if (mode === "resend") return ["resend", "smtp"];
    if (mode === "smtp") return ["smtp", "resend"];
    return ["resend", "smtp"];
  })();

  const details: string[] = [];
  let attempted = false;

  for (const provider of providerOrder) {
    if (provider === "resend") {
      if (!resend) {
        details.push("resend not configured");
        continue;
      }
      if (!resendFrom) {
        details.push("CONTACT_FROM_EMAIL / RESEND_FROM_EMAIL missing");
        continue;
      }
      attempted = true;
      const result = await sendViaResend({ from: resendFrom, to, payload: input });
      if (result.ok) return { ok: true, provider: "resend" };
      details.push(`resend: ${result.detail}`);
      continue;
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    if (!smtpHost) {
      details.push("smtp not configured");
      continue;
    }
    if (!smtpFrom) {
      details.push("SMTP_FROM_EMAIL / CONTACT_FROM_EMAIL / SMTP_USER missing");
      continue;
    }
    attempted = true;
    const result = await sendViaSmtp({ from: smtpFrom, to, payload: input });
    if (result.ok) return { ok: true, provider: "smtp" };
    details.push(`smtp: ${result.detail}`);
  }

  if (!attempted) {
    return {
      ok: false,
      error: "provider_not_configured",
      detail: details.join("; "),
    };
  }

  return {
    ok: false,
    error: "provider_error",
    detail: details.join("; "),
  };
}
