import type { Metadata } from "next";

import type { Language } from "@/lib/i18n";
import { CONTACT_COPY } from "@/lib/content/site-copy";
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
  const c = CONTACT_COPY[lang];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] rise-in">
      <section className="surface-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,217,255,0.16),transparent_68%)]" />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/35 bg-[rgba(216,178,107,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--finance-gold)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
            {c.eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.title}
          </h1>
          <p className="max-w-2xl text-pretty text-foreground/70">
            {c.subtitle}
          </p>
          <ContactForm lang={lang} />
        </div>
      </section>

      <aside className="surface-card space-y-5 rounded-3xl p-6 text-sm text-foreground/75">
        <p className="font-medium text-foreground/90">
          {c.asideTitle}
        </p>
        <p>
          {c.asideBody}
        </p>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.6)] p-4">
            <p className="text-xs uppercase tracking-wide text-foreground/55">
              {c.responseLabel}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {c.responseValue}
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-[rgba(8,16,28,0.6)] p-4">
            <p className="text-xs uppercase tracking-wide text-foreground/55">
              {c.scopeLabel}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {c.scopeValue}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
