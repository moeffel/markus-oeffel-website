"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TurnstileWidget } from "@/components/turnstile";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";
import type { Language } from "@/lib/i18n";

type ContactState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | {
      kind: "error";
      message: string;
      code:
        | "validation_error"
        | "rate_limited"
        | "captcha_required"
        | "captcha_invalid"
        | "provider_not_configured"
        | "provider_error"
        | "network_error"
        | "unknown";
    };

type ContactErrorResponse =
  | {
      error: "validation_error";
      fields?: Partial<
        Record<"name" | "email" | "message" | "company" | "intent", string[]>
      >;
    }
  | { error: "rate_limited" }
  | { error: "captcha_required" }
  | { error: "captcha_invalid"; codes?: string[] }
  | { error: "provider_not_configured"; detail?: string | null }
  | { error: "provider_error"; detail?: string | null };

function parseIntent(
  value: string | null,
): "employer" | "client" | "other" | null {
  if (value === "employer" || value === "client" || value === "other") {
    return value;
  }
  return null;
}

function cvRequestTemplate(lang: Language): string {
  return lang === "de"
    ? "Hallo Markus,\n\nich möchte deinen aktuellen CV anfordern.\n\nKontext:\nRolle/Firma:\nWarum ich mich melde:\n\nViele Grüße"
    : "Hi Markus,\n\nI would like to request your current CV.\n\nContext:\nRole/company:\nWhy I am reaching out:\n\nBest regards";
}

function hasBasicPublicEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export function ContactForm({ lang }: { lang: Language }) {
  const searchParams = useSearchParams();
  const template = searchParams.get("template");
  const isCvRequestFromUrl = template === "cv-request";
  const intentFromUrl = parseIntent(searchParams.get("intent"));
  const initialIntent = isCvRequestFromUrl
    ? "employer"
    : (intentFromUrl ?? "other");

  const [state, setState] = useState<ContactState>({ kind: "idle" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    isCvRequestFromUrl ? cvRequestTemplate(lang) : "",
  );
  const [company, setCompany] = useState("");
  const [intent, setIntent] = useState<"employer" | "client" | "other">(
    initialIntent,
  );
  const [isCvRequest] = useState(isCvRequestFromUrl);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const fallbackEmail =
    process.env.NEXT_PUBLIC_CONTACT_FALLBACK_EMAIL?.trim() ||
    "markus.oeffel@gmail.com";
  const fallbackMailtoHref = useMemo(() => {
    const subject = isCvRequest
      ? lang === "de"
        ? "CV-Anfrage über markusoeffel.com"
        : "CV request via markusoeffel.com"
      : lang === "de"
        ? "Kontaktanfrage über markusoeffel.com"
        : "Contact request via markusoeffel.com";
    const body = [
      `${lang === "de" ? "Name" : "Name"}: ${name.trim() || "-"}`,
      `Email: ${email.trim() || "-"}`,
      `${lang === "de" ? "Anliegen" : "Intent"}: ${intent}`,
      `${lang === "de" ? "Unternehmen" : "Company"}: ${company.trim() || "-"}`,
      "",
      message.trim() || "-",
    ].join("\n");
    return `mailto:${encodeURIComponent(
      fallbackEmail,
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [company, email, fallbackEmail, intent, isCvRequest, lang, message, name]);
  const fieldClassName =
    "h-11 w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]";
  const textareaClassName =
    "w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!hasBasicPublicEmailShape(normalizedEmail)) {
      setState({
        kind: "error",
        code: "validation_error",
        message:
          lang === "de"
            ? "Bitte gültige E-Mail eingeben (z. B. name@firma.com)."
            : "Please enter a valid email (e.g. name@company.com).",
      });
      return;
    }

    setState({ kind: "submitting" });

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        message: message.trim(),
        company: company.trim() ? company : undefined,
        intent,
        captcha_token:
          captchaRequired && captchaToken.trim() ? captchaToken : undefined,
      }),
    }).catch(() => null);

    if (!res) {
      setState({
        kind: "error",
        code: "network_error",
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
          code: "captcha_required",
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
          code: "captcha_invalid",
          message:
            lang === "de"
              ? "Captcha ungültig. Bitte erneut versuchen."
              : "Invalid captcha. Please try again.",
        });
        return;
      }

      if (err?.error === "validation_error") {
        const hasEmailIssue = Boolean(err.fields?.email?.length);
        const hasNameIssue = Boolean(err.fields?.name?.length);
        const hasMessageIssue = Boolean(err.fields?.message?.length);
        setState({
          kind: "error",
          code: "validation_error",
          message:
            lang === "de"
              ? hasEmailIssue
                ? "Bitte gültige E-Mail eingeben (z. B. name@firma.com)."
                : hasNameIssue || hasMessageIssue
                  ? "Bitte Name und Nachricht vollständig ausfüllen."
                  : "Eingaben sind nicht gültig. Bitte Formular prüfen."
              : hasEmailIssue
                ? "Please enter a valid email (e.g. name@company.com)."
                : hasNameIssue || hasMessageIssue
                  ? "Please complete name and message."
                  : "Input is invalid. Please review the form.",
        });
        return;
      }

      if (err?.error === "rate_limited") {
        setState({
          kind: "error",
          code: "rate_limited",
          message:
            lang === "de"
              ? "Zu viele Anfragen in kurzer Zeit. Bitte in 1 Minute erneut versuchen."
              : "Too many requests in a short time. Please retry in 1 minute.",
        });
        return;
      }

      if (err?.error === "provider_not_configured") {
        const detail = (err.detail ?? "").toLowerCase();
        const missingInbox =
          detail.includes("missing_contact_to") ||
          detail.includes("contact_to_email") ||
          detail.includes("resend_to_email") ||
          detail.includes("smtp_to_email");
        const noProvider =
          detail.includes("resend not configured") &&
          detail.includes("smtp not configured");

        setState({
          kind: "error",
          code: "provider_not_configured",
          message:
            lang === "de"
              ? missingInbox
                ? "Kontaktversand nicht aktiv: CONTACT_TO_EMAIL (oder RESEND_TO_EMAIL/SMTP_TO_EMAIL) fehlt."
                : noProvider
                  ? "Kontaktversand nicht aktiv: Weder Resend noch SMTP ist konfiguriert."
                  : "Kontaktversand ist noch nicht konfiguriert (CONTACT_TO_EMAIL + Resend oder SMTP)."
              : missingInbox
                ? "Contact delivery inactive: CONTACT_TO_EMAIL (or RESEND_TO_EMAIL/SMTP_TO_EMAIL) is missing."
                : noProvider
                  ? "Contact delivery inactive: neither Resend nor SMTP is configured."
                  : "Contact delivery is not configured yet (CONTACT_TO_EMAIL + Resend or SMTP).",
        });
        return;
      }

      if (err?.error === "provider_error") {
        const detail = (err.detail ?? "").toLowerCase();
        const likelyFromIssue =
          detail.includes("from") ||
          detail.includes("domain") ||
          detail.includes("sender") ||
          detail.includes("verify");
        const likelyAuthIssue =
          detail.includes("api key") ||
          detail.includes("auth") ||
          detail.includes("unauthorized");
        setState({
          kind: "error",
          code: "provider_error",
          message:
            lang === "de"
              ? likelyFromIssue
                ? "Mail-Provider hat den Absender abgelehnt (From/Domain prüfen)."
                : likelyAuthIssue
                  ? "Mail-Provider Auth fehlgeschlagen (API-Key prüfen)."
                  : "Mail-Provider Fehler. Bitte später erneut versuchen."
              : likelyFromIssue
                ? "Mail provider rejected sender (check from/domain)."
                : likelyAuthIssue
                  ? "Mail provider auth failed (check API key)."
                  : "Mail provider error. Please try again later.",
        });
        return;
      }

      setState({
        kind: "error",
        code: "unknown",
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
      {isCvRequest ? (
        <div className="rounded-xl border border-[var(--accent-cyan)]/35 bg-[rgba(53,242,209,0.09)] px-4 py-3 text-xs text-[var(--accent-cyan)]">
          {lang === "de"
            ? "CV-Request aktiv: Name, E-Mail und Nachricht sind erforderlich."
            : "CV request mode active: name, email, and message are required."}
        </div>
      ) : null}
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
          disabled={isCvRequest}
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
        {state.kind === "error" &&
        (state.code === "provider_not_configured" ||
          state.code === "provider_error") ? (
          <a
            href={fallbackMailtoHref}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--accent-cyan)]/40 px-4 text-xs font-medium text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/70 hover:bg-[rgba(53,242,209,0.1)]"
          >
            {lang === "de"
              ? "Alternativ direkt per E-Mail senden"
              : "Alternatively send directly by email"}
          </a>
        ) : null}
      </div>
    </form>
  );
}
