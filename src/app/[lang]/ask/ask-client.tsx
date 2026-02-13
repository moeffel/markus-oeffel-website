"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Markdown } from "@/components/markdown/markdown";
import { TurnstileWidget } from "@/components/turnstile";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";
import type { AskCitation, AskResponse, AskSuggestedLink } from "@/lib/ask/answer";
import type { Language } from "@/lib/i18n";

type AskState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: AskResponse };

type AskErrorResponse =
  | { error: "validation_error" }
  | { error: "rate_limited" }
  | { error: "budget_exceeded" }
  | { error: "captcha_required" }
  | { error: "captcha_invalid"; codes?: string[] }
  | { error: "provider_error" };

type AskStreamEvent =
  | { type: "meta"; citations: AskCitation[]; suggested_links: AskSuggestedLink[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

const SUGGESTED_QUERIES: Record<Language, string[]> = {
  de: [
    "Welche Rolle hattest du 2020?",
    "Welche Skills kommen direkt aus deinen Zertifikaten?",
    "Wie war das Setup deiner ARIMA-GARCH-Masterarbeit?",
    "Was machst du als Product Owner im Finanzierungsbereich?",
  ],
  en: [
    "What was your role in 2020?",
    "Which skills come directly from your certificates?",
    "How was your ARIMA-GARCH thesis setup?",
    "What do you do as a product owner in financing?",
  ],
};

export function AskClient({
  lang,
  variant = "page",
}: {
  lang: Language;
  variant?: "page" | "embed";
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AskState>({ kind: "idle" });
  const [history, setHistory] = useState<
    Array<{ q: string; a: AskResponse | null }>
  >([]);

  const [answerMarkdown, setAnswerMarkdown] = useState("");
  const [showCitations, setShowCitations] = useState(variant !== "embed");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (variant === "page") inputRef.current?.focus();
  }, [variant]);

  const suggested = useMemo(() => SUGGESTED_QUERIES[lang], [lang]);

  async function runAskStream(q: string): Promise<AskResponse> {
    const res = await fetch("/api/ask/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: q,
        lang,
        captcha_token: captchaToken.trim() ? captchaToken : undefined,
      }),
    }).catch(() => null);

    if (!res) throw new Error("network_error");
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as AskErrorResponse | null;
      throw new Error(err?.error ?? "provider_error");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("no_stream");

    const decoder = new TextDecoder();
    let buf = "";

    let answer = "";
    let nextCitations: AskCitation[] = [];
    let nextSuggestedLinks: AskSuggestedLink[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const evt = JSON.parse(trimmed) as AskStreamEvent;

        if (evt.type === "meta") {
          nextCitations = evt.citations ?? [];
          nextSuggestedLinks = evt.suggested_links ?? [];
          continue;
        }

        if (evt.type === "delta") {
          if (evt.text) {
            answer += evt.text;
            setAnswerMarkdown(answer);
          }
          continue;
        }

        if (evt.type === "error") {
          throw new Error(evt.error || "provider_error");
        }
      }
    }

    return {
      answer,
      citations: nextCitations,
      suggested_links: nextSuggestedLinks,
    };
  }

  async function runAsk(nextQuery: string) {
    const q = nextQuery.trim();
    if (!q) return;

    if (siteKey && !captchaToken.trim()) {
      setState({
        kind: "error",
        message:
          lang === "de"
            ? "Bitte Captcha bestätigen."
            : "Please complete the captcha.",
      });
      return;
    }

    setState({ kind: "loading" });
    setAnswerMarkdown("");
    trackPlausibleEvent("ask_query", { lang, q_len: q.length });
    try {
      const data = await runAskStream(q);
      setState({ kind: "done", data });
      setHistory((h) => [...h, { q, a: data }]);
      return;
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err);
      if (msg === "captcha_required") {
        setState({
          kind: "error",
          message:
            lang === "de"
              ? "Bitte Captcha bestätigen und erneut fragen."
              : "Please complete the captcha and try again.",
        });
        return;
      }

      if (msg === "captcha_invalid") {
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

      if (msg === "budget_exceeded") {
        setState({
          kind: "error",
          message:
            lang === "de"
              ? "AI Budget erreicht. Bitte später erneut versuchen oder Kontakt aufnehmen."
              : "AI budget exceeded. Please try again later or contact me.",
        });
        setHistory((h) => [...h, { q, a: null }]);
        return;
      }

      // fallback to non-streaming endpoint
      const fallback = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: q,
          lang,
          captcha_token: captchaToken.trim() ? captchaToken : undefined,
        }),
      }).catch(() => null);

      const data = (await fallback?.json().catch(() => null)) as AskResponse | null;
      if (!fallback || !fallback.ok || !data) {
        setState({
          kind: "error",
          message: lang === "de" ? "Ask API Fehler." : "Ask API error.",
        });
        setHistory((h) => [...h, { q, a: null }]);
        return;
      }

      setAnswerMarkdown(data.answer);
      setState({ kind: "done", data });
      setHistory((h) => [...h, { q, a: data }]);
    }
  }

  return (
    <div
      className={
        variant === "embed"
          ? "rounded-3xl border border-white/10 bg-[rgba(8,16,28,0.35)] p-5 sm:p-6"
          : "rounded-3xl border border-black/5 p-6 dark:border-white/10"
      }
    >
      {siteKey ? (
        <div className="mb-4 rounded-2xl border border-black/5 p-4 dark:border-white/10">
          <p className="text-xs font-medium text-foreground/70">
            {lang === "de" ? "Spam-Schutz" : "Spam protection"}
          </p>
          <div className="mt-3">
            <TurnstileWidget
              siteKey={siteKey}
              onToken={(t) => setCaptchaToken(t)}
              resetKey={captchaResetKey}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runAsk(query);
          }}
          placeholder={lang === "de" ? "Frag mich was…" : "Ask me anything…"}
          className="h-12 w-full rounded-2xl border border-black/10 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-black/15 dark:border-white/15 dark:focus:ring-white/15"
        />
        <button
          type="button"
          onClick={() => runAsk(query)}
          disabled={state.kind === "loading"}
          className="h-12 shrink-0 rounded-2xl bg-foreground px-5 text-sm font-medium text-background disabled:opacity-60"
        >
          {state.kind === "loading"
            ? lang === "de"
              ? "Thinking…"
              : "Thinking…"
            : "Ask"}
        </button>
      </div>

      {variant === "page" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggested.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                runAsk(s);
              }}
              className="rounded-full border border-black/10 px-4 py-2 text-xs text-foreground/80 hover:border-black/20 dark:border-white/15 dark:hover:border-white/25"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {state.kind === "error" ? (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {state.kind === "loading" && answerMarkdown ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-5 text-sm text-foreground/85 dark:border-white/10 dark:bg-white/[0.03]">
            <Markdown text={answerMarkdown} />
          </div>
        </div>
      ) : null}

      {state.kind === "done" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-5 text-sm text-foreground/85 dark:border-white/10 dark:bg-white/[0.03]">
            <Markdown text={state.data.answer} />
          </div>

          {state.data.suggested_links.length ? (
            <div className="flex flex-wrap gap-2">
              {state.data.suggested_links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  data-plausible-event="ask_click_source"
                  data-plausible-props={JSON.stringify({ href: l.href, label: l.label, lang })}
                  className="rounded-full bg-black/5 px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground/70">
                Citations ({state.data.citations.length})
              </p>
              {variant === "embed" ? (
                <button
                  type="button"
                  onClick={() => setShowCitations((s) => !s)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-foreground/75 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
                >
                  {showCitations
                    ? lang === "de"
                      ? "Ausblenden"
                      : "Hide"
                    : lang === "de"
                      ? "Zeigen"
                      : "Show"}
                </button>
              ) : null}
            </div>
            {state.data.citations.length === 0 ? (
              <p className="text-sm text-foreground/70">
                {lang === "de"
                  ? "Keine passenden Quellen im Corpus gefunden."
                  : "No matching sources found in the corpus."}
              </p>
            ) : showCitations ? (
              <ul className="space-y-2">
                {state.data.citations.map((c, idx) => (
                  <li
                    key={`${c.doc_id}:${c.section_id}:${idx}`}
                    className="rounded-2xl border border-black/5 p-4 text-sm dark:border-white/10"
                  >
                    <p className="text-xs font-medium text-foreground/70">
                      {c.title} · {c.section_id}
                    </p>
                    <p className="mt-2 text-foreground/80">{c.snippet}</p>
                    <p className="mt-2 text-xs text-foreground/55">{c.doc_id}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {variant === "page" && history.length ? (
        <div className="mt-8 border-t border-black/5 pt-6 dark:border-white/10">
          <p className="text-xs font-medium text-foreground/70">
            {lang === "de" ? "History" : "History"}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/75">
            {history
              .slice()
              .reverse()
              .slice(0, 5)
              .map((h, i) => (
                <li key={`${h.q}:${i}`} className="truncate">
                  {h.q}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
