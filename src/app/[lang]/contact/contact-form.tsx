"use client";

import { useState } from "react";

import { TurnstileWidget } from "@/components/turnstile";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";
import type { Language } from "@/lib/i18n";

type ContactState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type ContactErrorResponse =
  | { error: "validation_error" }
  | { error: "rate_limited" }
  | { error: "captcha_required" }
  | { error: "captcha_invalid"; codes?: string[] }
  | { error: "provider_not_configured" }
  | { error: "provider_error" };

export function ContactForm({ lang }: { lang: Language }) {
  const [state, setState] = useState<ContactState>({ kind: "idle" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [intent, setIntent] = useState<"employer" | "client" | "other">("other");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const fieldClassName =
    "h-11 w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]";
  const textareaClassName =
    "w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        message,
        company: company.trim() ? company : undefined,
        intent,
        captcha_token:
          captchaRequired && captchaToken.trim() ? captchaToken : undefined,
      }),
    }).catch(() => null);

    if (!res) {
      setState({
        kind: "error",
        message: lang === "de" ? "Netzwerkfehler." : "Network error.",
      });
      return;
    }

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as
        | ContactErrorResponse
        | null;

      if (err?.error === "captcha_required") {
        setCaptchaRequired(true);
        setState({
          kind: "error",
          message:
            lang === "de"
              ? "Bitte Captcha bestätigen und erneut senden."
              : "Please complete the captcha and submit again.",
        });
        return;
      }

      if (err?.error === "captcha_invalid") {
        setCaptchaToken("");
        setCaptchaResetKey((k) => k + 1);
        setState({
          kind: "error",
          message:
            lang === "de"
              ? "Captcha ungültig. Bitte erneut versuchen."
              : "Invalid captcha. Please try again.",
        });
        return;
      }

      if (err?.error === "provider_not_configured") {
        setState({
          kind: "error",
          message:
            lang === "de"
              ? "Kontakt ist noch nicht komplett konfiguriert. Bitte später erneut versuchen."
              : "Contact delivery is not fully configured yet. Please try again later.",
        });
        return;
      }

      setState({
        kind: "error",
        message:
          lang === "de"
            ? "Konnte nicht senden."
            : "Could not send.",
      });
      return;
    }

    setCaptchaToken("");
    setCaptchaResetKey((k) => k + 1);
    trackPlausibleEvent("submit_contact", { lang, intent });
    setState({ kind: "success" });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-xs font-medium text-foreground/70">
            {lang === "de" ? "Name" : "Name"}
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === "de" ? "Max Mustermann" : "Jane Doe"}
            className={fieldClassName}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-xs font-medium text-foreground/70">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === "de" ? "max@firma.de" : "jane@company.com"}
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span className="text-xs font-medium text-foreground/70">
          {lang === "de" ? "Anliegen" : "Intent"}
        </span>
        <select
          value={intent}
          onChange={(e) =>
            setIntent(e.target.value as "employer" | "client" | "other")
          }
          className={fieldClassName}
        >
          <option value="employer">{lang === "de" ? "Arbeitgeber" : "Employer"}</option>
          <option value="client">{lang === "de" ? "Kunde" : "Client"}</option>
          <option value="other">{lang === "de" ? "Sonstiges" : "Other"}</option>
        </select>
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-xs font-medium text-foreground/70">
          {lang === "de" ? "Unternehmen (optional)" : "Company (optional)"}
        </span>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={lang === "de" ? "Firma GmbH" : "Acme Inc."}
          className={fieldClassName}
        />
      </label>

      <label className="space-y-2 text-sm">
        <span className="text-xs font-medium text-foreground/70">
          {lang === "de" ? "Message" : "Message"}
        </span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder={
            lang === "de"
              ? "Projektkontext, Ziel, Timeline, gewünschte Unterstützung …"
              : "Project context, goal, timeline, desired support …"
          }
          className={textareaClassName}
        />
      </label>

      {captchaRequired ? (
        <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.6)] p-4">
          <p className="text-xs font-medium text-foreground/70">
            {lang === "de" ? "Spam-Schutz" : "Spam protection"}
          </p>
          {siteKey ? (
            <div className="mt-3">
              <TurnstileWidget
                siteKey={siteKey}
                onToken={(t) => setCaptchaToken(t)}
                resetKey={captchaResetKey}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-foreground/70">
              {lang === "de"
                ? "Turnstile ist nicht konfiguriert (NEXT_PUBLIC_TURNSTILE_SITE_KEY)."
                : "Turnstile is not configured (NEXT_PUBLIC_TURNSTILE_SITE_KEY)."}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="finance-ring inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--finance-gold)] to-[#c89e55] px-6 text-sm font-semibold text-[#131922] transition hover:brightness-110 disabled:opacity-60"
        >
          {state.kind === "submitting"
            ? lang === "de"
              ? "Sende…"
              : "Sending…"
            : lang === "de"
              ? "Senden"
              : "Send"}
        </button>

        {state.kind === "success" ? (
          <p className="rounded-full border border-[var(--accent-emerald)]/40 bg-[rgba(76,224,179,0.13)] px-3 py-1 text-sm text-[var(--accent-emerald)]">
            {lang === "de" ? "Gesendet." : "Sent."}
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p className="rounded-full border border-red-400/35 bg-red-500/10 px-3 py-1 text-sm text-red-300">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
