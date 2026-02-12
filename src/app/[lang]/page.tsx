import type { Metadata } from "next";
import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import { JsonLd } from "@/components/json-ld";
import { AskClient } from "@/app/[lang]/ask/ask-client";
import { getSiteSettings } from "@/lib/content";
import { LANDING_COPY } from "@/lib/content/site-copy";
import type { Language } from "@/lib/i18n";
import { alternatesForPath, getSiteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const c = LANDING_COPY[lang];
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
  const c = LANDING_COPY[lang];
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const profilePhotoSrc = process.env.NEXT_PUBLIC_PROFILE_PHOTO ?? "/profile-placeholder.svg";
  const profilePhotoUrl =
    profilePhotoSrc.startsWith("http://") || profilePhotoSrc.startsWith("https://")
      ? profilePhotoSrc
      : `${siteUrl}${profilePhotoSrc.startsWith("/") ? profilePhotoSrc : `/${profilePhotoSrc}`}`;
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
        image: profilePhotoUrl,
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
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/45 bg-[rgba(216,178,107,0.09)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--finance-gold)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
              About + Execution
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {c.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-[var(--muted)]">
              {c.sub}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {c.proofChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[var(--accent-cyan)]/25 bg-[rgba(93,217,255,0.08)] px-3 py-1 text-xs text-[var(--accent-cyan)]"
                >
                  {chip}
                </span>
              ))}
            </div>

            <ul className="mt-6 grid gap-2 text-sm text-foreground/85 sm:grid-cols-2">
              {c.trustPoints.map((point) => (
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

          <aside className="surface-card rounded-3xl p-5 sm:p-6">
            <div className="mx-auto w-fit">
              <ProfilePhoto alt="Markus Öffel portrait" size={300} className="finance-ring" priority />
            </div>
            <p className="mt-5 text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {c.aboutEyebrow}
            </p>
            <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {c.aboutTitle}
            </h2>
            <p className="mt-2 text-sm text-foreground/72">{c.aboutSubtitle}</p>
            <div className="mt-4 space-y-2">
              {c.aboutHighlights.map((point) => (
                <p
                  key={point}
                  className="rounded-xl border border-white/10 bg-[rgba(3,9,17,0.62)] px-3 py-2 text-xs text-foreground/80"
                >
                  {point}
                </p>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
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
          </aside>
        </div>
      </section>

      <section className="surface-card cyber-grid relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(226,107,255,0.17),transparent_70%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {c.aboutEyebrow}
            </p>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {c.aboutTitle}
            </h2>
            <p className="mt-3 text-sm text-foreground/72 sm:text-base">{c.aboutSubtitle}</p>
            <div className="mt-4 space-y-3 text-sm text-foreground/78 sm:text-base">
              {c.aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-foreground/84">
              {c.aboutHighlights.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_10px_rgba(93,217,255,0.45)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/${lang}/projects`}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-foreground/85 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
              >
                {lang === "de" ? "Case Studies öffnen" : "Open case studies"}
              </Link>
              <Link
                href={`/${lang}/thesis`}
                className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-foreground/85 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
              >
                {lang === "de" ? "Masterarbeit ansehen" : "View thesis"}
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[rgba(5,12,22,0.6)] p-4">
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {lang === "de" ? "Execution-Basis" : "Execution baseline"}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {kpis.slice(0, 3).map((tile) => (
                <div
                  key={tile.kpi}
                  className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-3"
                >
                  <p className="text-[10px] uppercase tracking-widest text-foreground/55">{tile.kpi}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{tile.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {c.focusAreas.slice(0, 3).map((area) => (
                <div
                  key={area.title}
                  className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-2"
                >
                  <p className="text-sm font-semibold text-foreground">{area.title}</p>
                  <p className="mt-1 text-xs text-foreground/70">{area.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card cyber-grid rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              Ask + RAG
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{c.askTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm text-foreground/70 sm:text-base">
              {c.askSubtitle}
            </p>
          </div>
          <Link
            href={`/${lang}/ask`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-foreground/85 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
          >
            {lang === "de" ? "Ask fullscreen" : "Open full Ask"}
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[rgba(5,12,22,0.6)] p-4">
            <AskClient lang={lang} variant="embed" />
          </div>
          <aside className="rounded-2xl border border-white/10 bg-[rgba(5,12,22,0.6)] p-4">
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {lang === "de" ? "Prompt-Ideen" : "Prompt ideas"}
            </p>
            <div className="mt-3 space-y-2">
              {c.askExamplePrompts.map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/80"
                >
                  {prompt}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--accent-cyan)] uppercase">
                {lang === "de" ? "RAG Guardrails" : "RAG guardrails"}
              </p>
              <ul className="mt-2 space-y-2 text-xs text-foreground/80">
                {c.ragGuardrails.map((guardrail) => (
                  <li key={guardrail} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)]" />
                    <span>{guardrail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(8,16,28,0.6)] p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
            {c.ragTitle}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {c.ragSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3"
              >
                <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--accent-cyan)] uppercase">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-xs text-foreground/80">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {c.focusTitle}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {lang === "de" ? "Woran ich aktuell baue" : "What I build right now"}
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              {lang === "de"
                ? "Ausgewählte Tracks mit technischem und produktivem Fokus."
                : "Selected tracks with a technical and outcome-oriented focus."}
            </p>
          </div>
          <Link
            href={`/${lang}/skills`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-foreground/85 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
          >
            {lang === "de" ? "Alle Skills" : "All skills"}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {c.focusAreas.map((area, index) => (
            <div key={area.title} className="rounded-2xl border border-white/10 bg-[rgba(5,12,22,0.6)] p-5">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[var(--accent-cyan)] uppercase">
                Track {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{area.title}</p>
              <p className="mt-2 text-sm text-foreground/70">{area.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
