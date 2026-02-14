import type { Metadata } from "next";
import Link from "next/link";

import type { Language } from "@/lib/i18n";
import { getExperience } from "@/lib/content";
import type { Domain } from "@/lib/content/schemas";
import { alternatesForPath } from "@/lib/seo";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "de" ? "Werdegang" : "Experience",
    description:
      lang === "de"
        ? "Timeline mit Outcomes und Tech-Stack."
        : "Timeline with outcomes and tech stack.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/experience" }),
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const experience = await getExperience();
  const uniqueTechCount = new Set(experience.flatMap((item) => item.tech)).size;
  const uniqueDomainCount = new Set(
    experience.flatMap((item) => item.domains),
  ).size;

  return (
    <div className="space-y-8 rise-in">
      <header className="surface-card relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.18),transparent_70%)]" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {lang === "de" ? "Execution Timeline" : "Execution Timeline"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {lang === "de" ? "Werdegang" : "Experience"}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-foreground/70">
            {lang === "de"
              ? "Timeline mit Outcomes und Tech-Stack."
              : "Timeline with outcomes and tech stack."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.1)] px-3 py-1 font-medium text-[var(--accent-cyan)]">
              {experience.length} {lang === "de" ? "Stationen" : "roles"}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
              {uniqueDomainCount} {lang === "de" ? "Domänen" : "domains"}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
              {uniqueTechCount} {lang === "de" ? "Tech-Themen" : "tech topics"}
            </span>
          </div>
          <Link
            href={`/${lang}/contact?intent=employer&template=cv-request`}
            className="finance-ring mt-5 inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[var(--finance-gold)] to-[#c89e55] px-4 text-xs font-semibold text-[#131922] transition hover:brightness-110"
          >
            {lang === "de" ? "CV per Mail anfragen" : "Request CV by email"}
          </Link>
          <p className="mt-2 text-xs text-foreground/60">
            {lang === "de"
              ? "Die Anfrage läuft über das Kontaktformular mit Pflichtfeldern (Name, E-Mail, Nachricht)."
              : "Request flow uses the contact form with required fields (name, email, message)."}
          </p>
        </div>
      </header>

      <section className="space-y-4">
        {experience.map((item) => (
          <article
            key={`${item.period}:${item.org ?? ""}`}
            className="surface-card relative rounded-3xl p-6 sm:p-7"
          >
            <span className="pointer-events-none absolute inset-y-6 left-0 w-px bg-gradient-to-b from-[var(--accent-cyan)]/0 via-[var(--accent-cyan)]/60 to-[var(--accent-cyan)]/0 sm:left-6" />
            <div className="relative sm:pl-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    {item.role[lang]}
                    {item.org ? (
                      <span className="text-foreground/70"> @ {item.org}</span>
                    ) : null}
                  </p>
                  {item.domains.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.domains.slice(0, 4).map((domain) => (
                        <span
                          key={`${item.period}:${domain}`}
                          className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.09)] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]"
                        >
                          {DOMAIN_LABELS[lang][domain]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-foreground/70">
                  {item.period}
                </span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-foreground/85">
                {item.outcomes[lang].map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_10px_rgba(76,224,179,0.55)]" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>

              {item.tech.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tech.slice(0, 10).map((tech) => (
                    <span
                      key={`${item.period}:${tech}`}
                      className="rounded-full border border-white/15 bg-[rgba(8,16,28,0.6)] px-3 py-1 text-xs text-foreground/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
