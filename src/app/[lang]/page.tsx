import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { getSiteSettings } from "@/lib/content";
import type { Language } from "@/lib/i18n";
import { alternatesForPath, getSiteUrl } from "@/lib/seo";

const COPY: Record<Language, { headline: string; sub: string }> = {
  de: {
    headline: "FinTech Builder. Trust-first. Subtil frech.",
    sub: "Premium Engineering für Payments, Risk & AI—ohne Buzzword-Wolke.",
  },
  en: {
    headline: "FinTech builder. Trust-first. Subtly bold.",
    sub: "Premium engineering for payments, risk & AI—without the buzzword fog.",
  },
};

const TRUST_POINTS: Record<Language, string[]> = {
  de: [
    "Trust-first Architektur für regulierte Umgebungen",
    "Delivery mit klaren KPIs statt Buzzword-Roadmaps",
    "AI nur mit belastbaren Quellen und Kostenkontrolle",
    "CFA Level I Kandidat — Prüfung geplant für August 2026",
  ],
  en: [
    "Trust-first architecture for regulated environments",
    "Delivery with clear KPIs instead of buzzword roadmaps",
    "AI only with reliable sources and cost controls",
    "CFA Level I candidate — exam planned for August 2026",
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const c = COPY[lang];
  return {
    title: lang === "de" ? "FinTech Builder" : "FinTech builder",
    description: c.sub,
    alternates: alternatesForPath({ lang }),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const c = COPY[lang];
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const kpis =
    settings.heroKpis.length
      ? settings.heroKpis.map((k) => ({
          kpi: k.label[lang],
          v: k.value,
        }))
      : [
          { kpi: lang === "de" ? "Shipping Speed" : "Shipping speed", v: "≤ 2w" },
          { kpi: lang === "de" ? "Security" : "Security", v: "AA" },
          { kpi: lang === "de" ? "RAG" : "RAG", v: "Cited" },
        ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Markus Öffel's Website",
        inLanguage: ["de", "en"],
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}#person`,
        name: "Markus Öffel",
        url: siteUrl,
        sameAs: settings.socialLinks.map((l) => l.url),
      },
    ],
  };

  return (
    <div className="space-y-10 rise-in">
      <JsonLd data={jsonLd} />
      <section className="cyber-grid surface-card relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-36 -left-36 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(226,107,255,0.18),transparent_68%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/45 bg-[rgba(216,178,107,0.09)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--finance-gold)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
              Finance-class × AI delivery
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {c.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-[var(--muted)]">
              {c.sub}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-foreground/85">
              {TRUST_POINTS[lang].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_10px_rgba(76,224,179,0.55)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {settings.bookCallUrl ? (
                <a
                  href={settings.bookCallUrl}
                  rel="noreferrer"
                  data-plausible-event="click_book_call"
                  data-plausible-props={JSON.stringify({ lang })}
                  className="finance-ring inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--finance-gold)] to-[#c89e55] px-6 text-sm font-semibold text-[#131922] transition hover:brightness-110"
                >
                  {lang === "de" ? "Call buchen" : "Book a call"}
                </a>
              ) : (
                <Link
                  href={`/${lang}/contact`}
                  className="finance-ring inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--finance-gold)] to-[#c89e55] px-6 text-sm font-semibold text-[#131922] transition hover:brightness-110"
                >
                  {lang === "de" ? "Kontakt" : "Contact"}
                </Link>
              )}
              <Link
                href={`/${lang}/projects`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--accent-cyan)]/45 bg-[rgba(93,217,255,0.08)] px-6 text-sm font-medium text-[var(--accent-cyan)] transition hover:bg-[rgba(93,217,255,0.15)]"
              >
                {lang === "de" ? "Projekte ansehen" : "View projects"}
              </Link>
              {settings.cvUrl ? (
                <a
                  href={settings.cvUrl}
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-foreground/90 transition hover:border-white/35 hover:bg-white/5"
                >
                  {lang === "de" ? "CV" : "CV"}
                </a>
              ) : null}
            </div>
          </div>

          <div className="surface-card rounded-3xl p-5 sm:p-6">
            <p className="font-mono text-[11px] tracking-[0.15em] text-[var(--accent-cyan)] uppercase">
              Live Signal
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[rgba(3,9,17,0.65)] p-4">
              <svg
                viewBox="0 0 340 120"
                className="h-24 w-full text-[var(--accent-cyan)]"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-cyan)" />
                    <stop offset="50%" stopColor="var(--accent-magenta)" />
                    <stop offset="100%" stopColor="var(--accent-emerald)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 98 L28 90 L54 84 L78 74 L102 79 L126 67 L152 62 L176 56 L202 49 L224 54 L250 41 L274 36 L298 24 L320 28 L340 14"
                  fill="none"
                  stroke="url(#sparkGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="sparkline-glow pulse-line"
                />
              </svg>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {kpis.slice(0, 3).map((tile) => (
                  <div
                    key={tile.kpi}
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center"
                  >
                    <p className="truncate text-[10px] uppercase tracking-widest text-foreground/55">
                      {tile.kpi}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{tile.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(9,17,29,0.72)] p-4 font-mono text-xs text-foreground/80">
              <p className="text-[var(--accent-emerald)]">$ ask --topic trust --domain fintech</p>
              <p className="mt-2 text-foreground/70">
                {lang === "de"
                  ? "Antworten mit Quellen, nicht mit Halluzinationen."
                  : "Answers with citations, not hallucinations."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {kpis.map((tile) => (
          <div
            key={tile.kpi}
            className="surface-card rounded-2xl p-6"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground/60">
              {tile.kpi}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {tile.v}
            </p>
            <div className="mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-magenta)]" />
          </div>
        ))}
      </section>
    </div>
  );
}
