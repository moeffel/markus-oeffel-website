import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAlternateLanguage, isLanguage, type Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ lang: "de" }, { lang: "en" }];
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  return params.then(({ lang }) => {
    const language = isLanguage(lang) ? (lang as Language) : null;
    if (!language) return {};

    const title =
      language === "de" ? "Markus Öffel's Website" : "Markus Öffel's Website";
    const description =
      language === "de"
        ? "Finance-class Portfolio mit cyberpunk AI accents."
        : "Finance-class portfolio with cyberpunk AI accents.";

    return {
      title,
      description,
      alternates: alternatesForPath({ lang: language }),
    };
  });
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();

  const alt = getAlternateLanguage(lang);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080d16]/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={`/${lang}`} className="group inline-flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-cyan)] via-[var(--accent-magenta)] to-[var(--finance-gold)] text-xs font-semibold text-black shadow-[0_0_16px_rgba(93,217,255,0.48)]">
              MÖ
            </span>
            <span className="text-sm font-semibold tracking-[0.12em] text-foreground/95 transition group-hover:text-[var(--accent-cyan)] sm:text-base">
              Markus Öffel
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-xs text-foreground/80 sm:gap-3 sm:text-sm">
            <Link
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)]"
              href={`/${lang}/projects`}
            >
              {lang === "de" ? "Projekte" : "Projects"}
            </Link>
            <Link
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)]"
              href={`/${lang}/experience`}
            >
              {lang === "de" ? "Werdegang" : "Experience"}
            </Link>
            <Link
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)]"
              href={`/${lang}/skills`}
            >
              {lang === "de" ? "Skills" : "Skills"}
            </Link>
            <Link
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)]"
              href={`/${lang}/ask`}
            >
              {lang === "de" ? "Ask" : "Ask"}
            </Link>
            <Link
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-[var(--accent-cyan)]/70 hover:text-[var(--accent-cyan)]"
              href={`/${lang}/contact`}
            >
              {lang === "de" ? "Kontakt" : "Contact"}
            </Link>
            <Link
              className="rounded-full border border-[var(--finance-gold)]/55 bg-[rgba(216,178,107,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--finance-gold)] transition hover:bg-[rgba(216,178,107,0.18)]"
              href={`/${alt}`}
              hrefLang={alt}
            >
              {alt.toUpperCase()}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-white/10 px-4 py-10 text-sm text-foreground/70 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p className="font-medium text-foreground">Markus Öffel's Website</p>
          <p>
            <Link className="hover:text-[var(--accent-cyan)]" href={`/${lang}/${
              lang === "de" ? "impressum" : "imprint"
            }`}>
              {lang === "de" ? "Impressum" : "Imprint"}
            </Link>
            {" · "}
            <Link className="hover:text-[var(--accent-cyan)]" href={`/${lang}/${
              lang === "de" ? "datenschutz" : "privacy"
            }`}>
              {lang === "de" ? "Datenschutz" : "Privacy"}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
