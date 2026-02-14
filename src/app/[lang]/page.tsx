import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { ProfilePhoto } from "@/components/profile-photo";
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
    title: "Markus Öffel",
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
  const profilePhotoSrc = process.env.NEXT_PUBLIC_PROFILE_PHOTO ?? "/profile.jpeg";
  const profilePhotoUrl =
    profilePhotoSrc.startsWith("http://") || profilePhotoSrc.startsWith("https://")
      ? profilePhotoSrc
      : `${siteUrl}${profilePhotoSrc.startsWith("/") ? profilePhotoSrc : `/${profilePhotoSrc}`}`;
  const focusAccents = [
    "rgba(53,242,209,0.2)",
    "rgba(154,123,255,0.2)",
    "rgba(166,255,94,0.16)",
    "rgba(53,242,209,0.16)",
  ] as const;

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
    <div className="space-y-8 rise-in">
      <JsonLd data={jsonLd} />

      <section className="aurora-panel dynamic-border lift-hover cyber-grid surface-card relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(53,242,209,0.2),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(154,123,255,0.14),transparent_68%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--finance-gold)]/45 bg-[rgba(154,123,255,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[var(--finance-gold)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--finance-gold)] pulse-line" />
              {lang === "de" ? "About me + delivery" : "About me + delivery"}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {c.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-[var(--muted)]">{c.sub}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {c.proofChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[var(--accent-cyan)]/35 bg-[rgba(53,242,209,0.1)] px-3 py-1 text-xs text-[var(--accent-cyan)]"
                >
                  {chip}
                </span>
              ))}
            </div>

            <ul className="mt-6 grid gap-2 text-sm text-foreground/85 sm:grid-cols-2">
              {c.trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)] shadow-[0_0_10px_rgba(166,255,94,0.55)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {settings.bookCallUrl ? (
                <a
                  href={settings.bookCallUrl}
                  rel="noreferrer"
                  data-plausible-event="click_book_call"
                  data-plausible-props={JSON.stringify({ lang })}
                  className="finance-ring inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-magenta)] px-6 text-sm font-semibold text-[#070a0f] transition hover:brightness-110"
                >
                  {lang === "de" ? "Kontakt starten" : "Start contact"}
                </a>
              ) : (
                <Link
                  href={`/${lang}/contact`}
                  className="finance-ring inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-magenta)] px-6 text-sm font-semibold text-[#070a0f] transition hover:brightness-110"
                >
                  {lang === "de" ? "Kontakt" : "Contact"}
                </Link>
              )}
              <Link
                href={`/${lang}/projects`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--accent-cyan)]/45 bg-[rgba(53,242,209,0.08)] px-6 text-sm font-medium text-[var(--accent-cyan)] transition hover:bg-[rgba(53,242,209,0.15)]"
              >
                {lang === "de" ? "Projekte ansehen" : "View projects"}
              </Link>
              <Link
                href={`/${lang}/contact?intent=employer&template=cv-request`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-foreground/90 transition hover:border-white/35 hover:bg-white/5"
              >
                {lang === "de" ? "CV per Mail anfragen" : "Request CV by email"}
              </Link>
            </div>
          </div>

          <aside className="dynamic-border surface-card rounded-3xl p-5 sm:p-6">
            <ProfilePhoto
              alt="Markus Öffel portrait"
              width={360}
              height={460}
              fit="contain"
              className="mx-auto"
              priority
            />
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
                  className="rounded-xl border border-white/10 bg-[rgba(7,10,15,0.45)] px-3 py-2 text-xs text-foreground/80"
                >
                  {point}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="dynamic-border lift-hover surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {lang === "de" ? "How I work" : "How I work"}
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
            {lang === "de" ? "Ask öffnen" : "Open Ask"}
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-white/10 bg-[rgba(7,10,15,0.36)] p-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {lang === "de" ? "About me / How I am" : "About me / How I am"}
            </h3>
            <div className="mt-3 space-y-3 text-sm text-foreground/80">
              {c.aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[rgba(7,10,15,0.36)] p-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {lang === "de" ? "Proof & Media" : "Proof & media"}
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href={`/${lang}/thesis`}
                className="flex items-center justify-between rounded-xl border border-white/12 px-3 py-2 text-foreground/80 transition hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)]"
              >
                <span>{lang === "de" ? "Masterarbeit (ARIMA-GARCH)" : "Master’s thesis (ARIMA-GARCH)"}</span>
                <span aria-hidden>→</span>
              </Link>
              <a
                href="/notebook.html"
                className="flex items-center justify-between rounded-xl border border-white/12 px-3 py-2 text-foreground/80 transition hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)]"
              >
                <span>{lang === "de" ? "Notebook-Walkthrough" : "Notebook walkthrough"}</span>
                <span aria-hidden>→</span>
              </a>
              <a
                href="https://github.com/moeffel"
                rel="noreferrer"
                target="_blank"
                className="flex items-center justify-between rounded-xl border border-white/12 px-3 py-2 text-foreground/80 transition hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)]"
              >
                <span>GitHub</span>
                <span aria-hidden>↗</span>
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="dynamic-border lift-hover surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-foreground/55 uppercase">
              {c.focusTitle}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {lang === "de" ? "Woran ich aktuell baue" : "What I build right now"}
            </h2>
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
            <div
              key={area.title}
              className="rounded-2xl border border-white/10 bg-[rgba(7,10,15,0.45)] p-5"
              style={{
                boxShadow: `inset 0 0 0 1px ${focusAccents[index % focusAccents.length]}`,
                backgroundImage: `linear-gradient(135deg, ${focusAccents[index % focusAccents.length]} 0%, rgba(7,10,15,0) 58%)`,
              }}
            >
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
