import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
  company?: string;
  intent?: string;
  ip?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!resend) return { ok: false, error: "missing_resend_key" };

  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!from || !to) return { ok: false, error: "missing_contact_env" };

  const subject = `Portfolio contact${input.intent ? ` (${input.intent})` : ""}: ${input.name}`;

  const text = [
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

  const res = await resend.emails
    .send({
      from,
      to,
      subject,
      replyTo: input.email,
      text,
    })
    .catch(() => null);

  if (!res || (res as any).error) return { ok: false, error: "provider_error" };
  return { ok: true };
}

