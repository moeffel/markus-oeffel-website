"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import type { CaseStudy, Domain } from "@/lib/content/schemas";
import type { Language } from "@/lib/i18n";

const DOMAIN_LABELS: Record<Language, Record<Domain, string>> = {
  de: {
    payments: "Payments",
    risk: "Risk",
    kyc: "KYC/AML",
    ai: "AI",
    data: "Data",
    infra: "Infra",
    investment: "Investment",
    other: "Other",
  },
  en: {
    payments: "Payments",
    risk: "Risk",
    kyc: "KYC/AML",
    ai: "AI",
    data: "Data",
    infra: "Infra",
    investment: "Investment",
    other: "Other",
  },
};

function toSearchParamsString(input: URLSearchParams): string {
  const out = input.toString();
  return out ? `?${out}` : "";
}

export function ProjectsIndex({
  lang,
  projects,
}: {
  lang: Language;
  projects: readonly CaseStudy[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const domain = searchParams.get("domain") ?? "all";
  const sort = searchParams.get("sort") ?? "impact";

  const [queryDraft, setQueryDraft] = useState(q);
  const hasActiveFilters = Boolean(q || domain !== "all" || sort !== "impact");

  const filtered = useMemo(() => {
    const queryTokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const byDomain =
      domain === "all"
        ? projects
        : projects.filter((p) => p.domains.includes(domain as Domain));

    const byQuery =
      queryTokens.length === 0
        ? byDomain
        : byDomain.filter((p) => {
            const haystack = [
              p.title[lang],
              p.subtitle?.[lang] ?? "",
              p.summary[lang],
              p.tags.join(" "),
              p.stack.join(" "),
              p.domains.join(" "),
            ]
              .join(" ")
              .toLowerCase();

            return queryTokens.every((t) => haystack.includes(t));
          });

    const sorted = [...byQuery].sort((a, b) => {
      if (sort === "newest") {
        return (b.date ?? "").localeCompare(a.date ?? "");
      }
      return (a.order ?? 999) - (b.order ?? 999);
    });

    return sorted;
  }, [domain, lang, projects, q, sort]);

  function updateQuery(next: { q?: string; domain?: string; sort?: string }) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (typeof next.q === "string") {
      if (next.q.trim()) nextParams.set("q", next.q.trim());
      else nextParams.delete("q");
    }
    if (typeof next.domain === "string") {
      if (next.domain === "all") nextParams.delete("domain");
      else nextParams.set("domain", next.domain);
    }
    if (typeof next.sort === "string") {
      if (next.sort === "impact") nextParams.delete("sort");
      else nextParams.set("sort", next.sort);
    }

    router.replace(`${pathname}${toSearchParamsString(nextParams)}`, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-8 rise-in">
      <header className="surface-card relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.18),transparent_70%)]" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {lang === "de" ? "Case Navigator" : "Case Navigator"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {lang === "de" ? "Projekte" : "Projects"}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-foreground/70">
            {lang === "de"
              ? "Filterbar, suchbar und als URL teilbar."
              : "Filterable, searchable and shareable by URL."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.1)] px-3 py-1 font-medium text-[var(--accent-cyan)]">
              {filtered.length} {lang === "de" ? "Treffer" : "results"}
            </span>
            {q ? (
              <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
                q: {q}
              </span>
            ) : null}
            {domain !== "all" ? (
              <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
                {DOMAIN_LABELS[lang][domain as Domain]}
              </span>
            ) : null}
            {sort === "newest" ? (
              <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
                {lang === "de" ? "Neueste zuerst" : "Newest first"}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="surface-card rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
            {lang === "de" ? "Filter" : "Filters"}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQueryDraft("");
                updateQuery({ q: "", domain: "all", sort: "impact" });
              }}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-foreground/75 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
            >
              {lang === "de" ? "Filter zurücksetzen" : "Reset filters"}
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-medium text-foreground/70">
              {lang === "de" ? "Suche" : "Search"}
            </span>
            <div className="flex gap-2">
              <input
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateQuery({ q: queryDraft });
                }}
                placeholder={
                  lang === "de"
                    ? "thesis, arima, financing…"
                    : "thesis, arima, financing…"
                }
                className="h-11 w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]"
              />
              <button
                type="button"
                onClick={() => updateQuery({ q: queryDraft })}
                className="finance-ring h-11 shrink-0 rounded-xl bg-gradient-to-r from-[var(--finance-gold)] to-[#c89e55] px-4 text-sm font-semibold text-[#131922]"
              >
                {lang === "de" ? "Go" : "Go"}
              </button>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-foreground/70">
              {lang === "de" ? "Domain" : "Domain"}
            </span>
            <select
              value={domain}
              onChange={(e) => updateQuery({ domain: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]"
            >
              <option value="all">{lang === "de" ? "Alle" : "All"}</option>
              {(Object.keys(DOMAIN_LABELS[lang]) as Domain[]).map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABELS[lang][d]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-foreground/70">
              {lang === "de" ? "Sortierung" : "Sort"}
            </span>
            <select
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="h-11 w-full rounded-xl border border-white/15 bg-[rgba(6,12,22,0.78)] px-3 text-sm outline-none transition focus:border-[var(--accent-cyan)]/70 focus:ring-2 focus:ring-[rgba(93,217,255,0.2)]"
            >
              <option value="impact">
                {lang === "de" ? "Most impact" : "Most impact"}
              </option>
              <option value="newest">{lang === "de" ? "Neueste" : "Newest"}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="surface-card rounded-2xl p-6 text-foreground/70">
            {lang === "de"
              ? "Keine Treffer. Probier eine andere Suche."
              : "No matches. Try a different search."}
          </div>
        ) : null}
        {filtered.map((p) => {
          const href =
            p.slug === "thesis"
              ? `/${lang}/thesis`
              : `/${lang}/projects/${p.slug}`;
          const isRedacted = p.confidentialityLevel === "redacted";

          return (
            <Link
              key={p.slug}
              href={href}
              data-plausible-event="open_case_study"
              data-plausible-props={JSON.stringify({ slug: p.slug, lang })}
              className="surface-card group rounded-3xl p-6 transition hover:border-[var(--accent-cyan)]/45 hover:shadow-[0_18px_40px_rgba(3,9,20,0.52)]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    {p.title[lang]}
                  </p>
                  {p.subtitle ? (
                    <p className="text-sm font-medium text-foreground/75">
                      {p.subtitle[lang]}
                    </p>
                  ) : null}
                  <p className="text-sm text-foreground/70">{p.summary[lang]}</p>
                </div>
                <span
                  className={
                    isRedacted
                      ? "mt-1 shrink-0 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/75"
                      : "mt-1 shrink-0 rounded-full border border-[var(--accent-emerald)]/45 bg-[rgba(76,224,179,0.12)] px-3 py-1 text-xs font-medium text-[var(--accent-emerald)]"
                  }
                >
                  {isRedacted
                    ? lang === "de"
                      ? "Redacted"
                      : "Redacted"
                    : lang === "de"
                      ? "Public"
                      : "Public"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.domains.slice(0, 3).map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.09)] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]"
                  >
                    {DOMAIN_LABELS[lang][d]}
                  </span>
                ))}
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs text-foreground/70"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {p.highlightMetrics.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {p.highlightMetrics.slice(0, 4).map((m) => (
                    <div
                      key={`${m.label[lang]}:${m.value}`}
                      className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.62)] p-4"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-foreground/55">
                        {m.label[lang]}
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-cyan)] transition group-hover:translate-x-0.5">
                {lang === "de" ? "Case öffnen" : "Open case study"}
                <span aria-hidden="true">→</span>
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
