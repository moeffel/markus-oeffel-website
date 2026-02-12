import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PlausibleEvent } from "@/components/analytics/plausible-provider";
import { JsonLd } from "@/components/json-ld";
import { TranslationFallbackNotice } from "@/components/translation-fallback-notice";
import { getCaseStudies, getCaseStudyBySlug } from "@/lib/content";
import type { Domain } from "@/lib/content/schemas";
import { createCaseStudyViewModel } from "@/lib/content/view-models";
import type { Language } from "@/lib/i18n";
import { alternatesForPath, getSiteUrl } from "@/lib/seo";

export const dynamicParams = false;

const DOMAIN_LABELS: Record<Language, Record<Domain, string>> = {
  de: {
    payments: "Payments",
    risk: "Risk/Fraud",
    kyc: "KYC/AML",
    ai: "AI",
    data: "Data",
    infra: "Infra",
    investment: "Investment",
    other: "Other",
  },
  en: {
    payments: "Payments",
    risk: "Risk/Fraud",
    kyc: "KYC/AML",
    ai: "AI",
    data: "Data",
    infra: "Infra",
    investment: "Investment",
    other: "Other",
  },
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card rounded-3xl p-6 sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SignalList({
  items,
  lang,
}: {
  items: ReadonlyArray<{ text: string; qualitative?: boolean }>;
  lang: Language;
}) {
  return (
    <ul className="space-y-2 text-sm text-foreground/85">
      {items.map((item, index) => (
        <li key={`${item.text}:${index}`} className="flex items-start gap-3">
          <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_10px_rgba(76,224,179,0.55)]" />
          <span>
            {item.text}
            {item.qualitative ? (
              <span className="ml-2 text-xs text-foreground/55">
                {lang === "de" ? "(qualitativ)" : "(qualitative)"}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export async function generateStaticParams(): Promise<
  Array<{ lang: Language; slug: string }>
> {
  const slugs = (await getCaseStudies({ publishedOnly: false }))
    .map((c) => c.slug)
    .filter((s) => s !== "thesis");

  return (["de", "en"] as const).flatMap((lang) =>
    slugs.map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (slug === "thesis") {
    return {
      title: lang === "de" ? "Thesis" : "Thesis",
      description:
        lang === "de"
          ? "Masterarbeit als flagship case study."
          : "Master’s thesis as a flagship case study.",
      alternates: alternatesForPath({ lang, pathAfterLang: "/thesis" }),
    };
  }

  const cs = await getCaseStudyBySlug(slug);
  if (!cs) return {};

  const viewModel = createCaseStudyViewModel(cs, lang);

  return {
    title: viewModel.title || (lang === "de" ? "Case Study" : "Case study"),
    description:
      viewModel.summary ||
      (lang === "de"
        ? "Case Study im Portfolio."
        : "Case study in the portfolio."),
    alternates: alternatesForPath({
      lang,
      pathAfterLang: `/projects/${slug}`,
    }),
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ lang: Language; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (slug === "thesis") {
    redirect(`/${lang}/thesis`);
  }

  const cs = await getCaseStudyBySlug(slug);
  if (!cs || !cs.published) notFound();

  const viewModel = createCaseStudyViewModel(cs, lang);
  const impact = viewModel.impact;
  const topMetrics = cs.highlightMetrics.slice(0, 4);
  const confidentialityLabel =
    cs.confidentialityLevel === "redacted"
      ? lang === "de"
        ? "Redacted"
        : "Redacted"
      : lang === "de"
        ? "Öffentlich"
        : "Public";

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Project",
    name: viewModel.title || cs.slug,
    description: viewModel.summary,
    url: `${siteUrl}/${lang}/projects/${slug}`,
    inLanguage: lang,
    keywords: [...cs.tags, ...cs.domains],
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] rise-in">
      <PlausibleEvent eventName="view_project" eventProps={{ slug, lang }} />
      <JsonLd data={jsonLd} />
      <article className="space-y-6">
        <header className="surface-card relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.18),transparent_70%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--finance-gold)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
              {lang === "de" ? "Case Dossier" : "Execution Dossier"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {viewModel.title || cs.slug}
            </h1>
            {cs.subtitle ? (
              <p className="mt-2 text-sm font-medium text-foreground/75">
                {cs.subtitle[lang]}
              </p>
            ) : null}
            <p className="mt-3 max-w-3xl text-pretty text-foreground/72">
              {viewModel.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span
                className={
                  cs.confidentialityLevel === "redacted"
                    ? "rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium text-foreground/75"
                    : "rounded-full border border-[var(--accent-emerald)]/45 bg-[rgba(76,224,179,0.12)] px-3 py-1 font-medium text-[var(--accent-emerald)]"
                }
              >
                {confidentialityLabel}
              </span>
              {cs.date ? (
                <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
                  {cs.date}
                </span>
              ) : null}
              {cs.domains.map((domain) => (
                <span
                  key={`${cs.slug}:${domain}`}
                  className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.1)] px-3 py-1 font-medium text-[var(--accent-cyan)]"
                >
                  {DOMAIN_LABELS[lang][domain]}
                </span>
              ))}
            </div>

            {topMetrics.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {topMetrics.map((metric) => (
                  <div
                    key={`${metric.label.en}:${metric.value}`}
                    className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-4"
                  >
                    <p className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
                      {metric.label[lang]}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5">
              <TranslationFallbackNotice
                lang={lang}
                fallbackFrom={viewModel.fallbackFrom}
                href={
                  viewModel.fallbackFrom
                    ? `/${viewModel.fallbackFrom}/projects/${slug}`
                    : `/${lang}/projects/${slug}`
                }
              />
            </div>

            {cs.confidentialityLevel === "redacted" ? (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                {lang === "de"
                  ? "Hinweis: Diese Case Study ist redacted (keine Client-Identifiers)."
                  : "Note: this case study is redacted (no client identifiers)."}
              </div>
            ) : null}
          </div>
        </header>

        <DetailSection title={lang === "de" ? "Kontext" : "Context"}>
          <p className="text-sm text-foreground/82">{viewModel.context}</p>
        </DetailSection>

        <DetailSection title={lang === "de" ? "Problem" : "Problem"}>
          <p className="text-sm text-foreground/82">{viewModel.problem}</p>
        </DetailSection>

        <DetailSection title={lang === "de" ? "Lösung" : "Solution"}>
          <SignalList
            lang={lang}
            items={viewModel.solution.map((item) => ({ text: item }))}
          />
        </DetailSection>

        {cs.architecture ? (
          <DetailSection title={lang === "de" ? "Architektur" : "Architecture"}>
            {cs.architecture.type === "text" ? (
              <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-4 text-sm text-foreground/82">
                {viewModel.architectureText ?? ""}
              </div>
            ) : cs.architecture.type === "mermaid" ? (
              <pre className="overflow-auto rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-4 text-xs text-foreground/82">
                {viewModel.architectureText ?? ""}
              </pre>
            ) : (
              <img
                src={cs.architecture.payload}
                alt={lang === "de" ? "Architekturdiagramm" : "Architecture diagram"}
                className="h-auto w-full rounded-2xl border border-white/12"
              />
            )}
          </DetailSection>
        ) : null}

        <DetailSection
          title={lang === "de" ? "Rahmenbedingungen" : "Constraints"}
        >
          <SignalList
            lang={lang}
            items={viewModel.constraints.map((item) => ({ text: item }))}
          />
        </DetailSection>

        <DetailSection title={lang === "de" ? "Meine Rolle" : "My role"}>
          <SignalList
            lang={lang}
            items={viewModel.yourRole.map((item) => ({ text: item }))}
          />
        </DetailSection>

        <DetailSection title={lang === "de" ? "Impact" : "Impact"}>
          <SignalList lang={lang} items={impact} />
        </DetailSection>

        {viewModel.learnings.length ? (
          <DetailSection title={lang === "de" ? "Learnings" : "Learnings"}>
            <SignalList
              lang={lang}
              items={viewModel.learnings.map((item) => ({ text: item }))}
            />
          </DetailSection>
        ) : null}

        <DetailSection title={lang === "de" ? "Stack" : "Stack"}>
          <div className="flex flex-wrap gap-2">
            {cs.stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-[rgba(8,16,28,0.58)] px-3 py-1 text-xs text-foreground/75"
              >
                {item}
              </span>
            ))}
          </div>
        </DetailSection>

        {cs.links.length ? (
          <DetailSection title={lang === "de" ? "Links" : "Links"}>
            <ul className="grid gap-2">
              {cs.links.map((link) => (
                <li key={`${link.label}:${link.url}`}>
                  <a
                    href={link.url}
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] px-4 py-3 text-sm font-medium text-foreground/80 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
                  >
                    <span>{link.label}</span>
                    <span>→</span>
                  </a>
                </li>
              ))}
            </ul>
          </DetailSection>
        ) : null}

        <section className="pt-2">
          <Link
            href={`/${lang}/projects`}
            className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
          >
            ← {lang === "de" ? "Zurück zu Projekten" : "Back to projects"}
          </Link>
        </section>
      </article>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="surface-card rounded-3xl p-6">
          <p className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
            {lang === "de" ? "Impact-Highlights" : "Impact highlights"}
          </p>
          <ul className="mt-4 space-y-3">
            {impact.slice(0, 3).map((item, index) => (
              <li key={`${item.text}:${index}`} className="text-sm text-foreground/82">
                <p className="font-medium">{item.text}</p>
                {item.qualitative ? (
                  <p className="text-xs text-foreground/55">
                    {lang === "de" ? "qualitatives Signal" : "qualitative signal"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-white/12 pt-5">
            <p className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
              {lang === "de" ? "Nächster Schritt" : "Next step"}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                className="block rounded-xl border border-white/12 bg-[rgba(8,16,28,0.58)] px-3 py-2 text-foreground/78 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
                href={`/${lang}/ask`}
              >
                {lang === "de"
                  ? "AI zum Projekt fragen →"
                  : "Ask AI about this work →"}
              </Link>
              <Link
                className="block rounded-xl border border-white/12 bg-[rgba(8,16,28,0.58)] px-3 py-2 text-foreground/78 transition hover:border-[var(--accent-cyan)]/45 hover:text-[var(--accent-cyan)]"
                href={`/${lang}/contact`}
              >
                {lang === "de" ? "Kontakt aufnehmen →" : "Contact →"}
              </Link>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-3xl p-6">
          <p className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
            {lang === "de" ? "Projektdaten" : "Project facts"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-3">
              <dt className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
                {lang === "de" ? "Vertraulichkeit" : "Confidentiality"}
              </dt>
              <dd className="mt-1 text-foreground/90">{confidentialityLabel}</dd>
            </div>
            {cs.date ? (
              <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-3">
                <dt className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
                  {lang === "de" ? "Datum" : "Date"}
                </dt>
                <dd className="mt-1 text-foreground/90">{cs.date}</dd>
              </div>
            ) : null}
            <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-3">
              <dt className="text-xs font-medium tracking-[0.12em] text-foreground/55 uppercase">
                {lang === "de" ? "Tags" : "Tags"}
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {cs.tags.map((tag) => (
                  <span
                    key={`${cs.slug}:${tag}`}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground/75"
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
