import type { Metadata } from "next";

import {
  getHowIWorkPrinciples,
  getSkillCategories,
} from "@/lib/content";
import type { Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "de" ? "Skills" : "Skills",
    description:
      lang === "de"
        ? "Engineering, FinTech Domains und AI/Data – kompakt und proof-oriented."
        : "Engineering, fintech domains, and AI/data — compact and proof-oriented.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/skills" }),
  };
}

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const [categories, howIWork] = await Promise.all([
    getSkillCategories(),
    getHowIWorkPrinciples(),
  ]);
  const accentByIndex = [
    "var(--accent-cyan)",
    "var(--accent-magenta)",
    "var(--accent-emerald)",
  ] as const;
  const totalSkillItems = categories.reduce(
    (count, category) => count + category.items.length,
    0,
  );

  return (
    <div className="space-y-8 rise-in">
      <header className="surface-card relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(226,107,255,0.18),transparent_70%)]" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {lang === "de" ? "Capability Matrix" : "Capability Matrix"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Skills
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-foreground/70">
            {lang === "de"
              ? "Kurz, klar, und mit Fokus auf Wirkung."
              : "Short, clear, and impact-focused."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.1)] px-3 py-1 font-medium text-[var(--accent-cyan)]">
              {categories.length} {lang === "de" ? "Kategorien" : "categories"}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
              {totalSkillItems} {lang === "de" ? "Skill-Items" : "skill items"}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-foreground/75">
              {howIWork.length} {lang === "de" ? "Arbeitsprinzipien" : "work principles"}
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {categories.map((category, index) => {
          const accent = accentByIndex[index % accentByIndex.length];
          const accentGlow =
            index % 3 === 0
              ? "rgba(53,242,209,0.2)"
              : index % 3 === 1
                ? "rgba(154,123,255,0.2)"
                : "rgba(166,255,94,0.18)";
          return (
          <article
            key={category.title.en}
            className="surface-card rounded-3xl p-6"
            style={{
              borderColor: "var(--line-strong)",
              backgroundImage: `linear-gradient(150deg, ${accentGlow} 0%, rgba(18,27,51,0.44) 58%, rgba(18,27,51,0.62) 100%)`,
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span
                className="block h-1.5 w-20 rounded-full"
                style={{ background: accent }}
              />
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase"
                style={{ borderColor: `${accent}55`, color: accent }}
              >
                Track {index + 1}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {category.title[lang]}
            </h2>
            <ul className="mt-5 space-y-3">
              {category.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-2xl border bg-[rgba(8,16,28,0.62)] p-4"
                  style={{
                    borderColor: `${accent}55`,
                    boxShadow: `inset 0 0 0 1px ${accent}22`,
                  }}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: accent }}
                    />
                    {item.name}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-sm text-foreground/70">{item.note[lang]}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
          );
        })}
      </section>

      <section className="surface-card rounded-3xl p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {lang === "de" ? "How I work" : "How I work"}
          </h2>
          <p className="text-sm text-foreground/65">
            {lang === "de"
              ? "Arbeitsweise mit Fokus auf Delivery, Qualität und Trust."
              : "Execution style focused on delivery, quality, and trust."}
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {howIWork.map((principle) => (
            <article
              key={principle.title.en}
              className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.58)] p-5"
            >
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {principle.title[lang]}
              </p>
              <p className="mt-2 text-sm text-foreground/70">
                {principle.body[lang]}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
