import type { Metadata } from "next";

import type { Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "de" ? "Kontakt" : "Contact",
    description:
      lang === "de"
        ? "Schreib kurz, worum es geht."
        : "Send a short note.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/contact" }),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] rise-in">
      <section className="surface-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.16),transparent_68%)]" />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {lang === "de" ? "Start a project" : "Start a project"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {lang === "de" ? "Kontakt" : "Contact"}
          </h1>
          <p className="max-w-2xl text-pretty text-foreground/70">
            {lang === "de"
              ? "Schreib kurz, worum es geht."
              : "Send a short note."}
          </p>
          <ContactForm lang={lang} />
        </div>
      </section>

      <aside className="surface-card space-y-5 rounded-3xl p-6 text-sm text-foreground/75">
        <p className="font-medium text-foreground/90">
          {lang === "de" ? "Prefer async?" : "Prefer async?"}
        </p>
        <p>
          {lang === "de"
            ? "Schick Kontext + Ziel + Deadline. Du bekommst einen klaren Plan als Antwort."
            : "Send context + goal + deadline. You’ll get a clear execution plan."}
        </p>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.6)] p-4">
            <p className="text-xs uppercase tracking-wide text-foreground/55">
              {lang === "de" ? "Response" : "Response"}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {lang === "de" ? "Innerhalb von 24h" : "Within 24h"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.6)] p-4">
            <p className="text-xs uppercase tracking-wide text-foreground/55">
              {lang === "de" ? "Scope" : "Scope"}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {lang === "de" ? "FinTech, Risk, AI, Data" : "FinTech, risk, AI, data"}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
