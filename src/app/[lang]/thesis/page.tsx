import type { Metadata } from "next";
import Link from "next/link";

import { PlausibleEvent } from "@/components/analytics/plausible-provider";
import { JsonLd } from "@/components/json-ld";
import { TranslationFallbackNotice } from "@/components/translation-fallback-notice";
import { getCaseStudyBySlug, getThesis } from "@/lib/content";
import { createThesisViewModel } from "@/lib/content/view-models";
import type { Language } from "@/lib/i18n";
import { alternatesForPath, getSiteUrl } from "@/lib/seo";

type ThesisResultRow = {
  asset: "BTC" | "ETH" | "DOGE" | "SOL";
  model: string;
  dmPriceP: string;
  dmVolP: string;
  kupiecP: string;
  christoffersenP: string;
  archLmP: string;
};

const THESIS_COLAB_URL =
  "https://colab.research.google.com/github/moeffel/markus-oeffel-website/blob/main/public/notebooks/thesis-arima-garch-walkthrough.ipynb";

const THESIS_RESULT_ROWS: readonly ThesisResultRow[] = [
  {
    asset: "BTC",
    model: "ARIMA(0,0,0) + FIGARCH(1,1)-t",
    dmPriceP: "0.748",
    dmVolP: "0.263",
    kupiecP: "0.505",
    christoffersenP: "0.347",
    archLmP: "0.875",
  },
  {
    asset: "ETH",
    model: "ARIMA(1,0,0) + FIGARCH(1,1)-t",
    dmPriceP: "0.967",
    dmVolP: "0.517",
    kupiecP: "0.039",
    christoffersenP: "0.058",
    archLmP: "0.992",
  },
  {
    asset: "DOGE",
    model: "ARIMA(0,0,0) + FIGARCH(1,1)-t",
    dmPriceP: "0.851",
    dmVolP: "0.692",
    kupiecP: "0.505",
    christoffersenP: "0.777",
    archLmP: "0.987",
  },
  {
    asset: "SOL",
    model: "ARIMA(0,0,0) + FIGARCH(1,1)-t",
    dmPriceP: "0.810",
    dmVolP: "0.288",
    kupiecP: "0.360",
    christoffersenP: "0.370",
    archLmP: "0.942",
  },
];

const HORIZON_SIGNALS: Record<Language, readonly string[]> = {
  de: [
    "SOL zeigt signifikante Return-Signale in der Multi-Horizon-Auswertung (h=7: p=0.030, h=14: p=0.026).",
    "BTC und SOL liefern in mittleren Horizonten punktuell bessere Signale als der Naive-Benchmark.",
    "Für ETH zeigt der 365-Tage-Robustness-Check stabilere VaR-Eigenschaften als das 60-Tage-Window.",
  ],
  en: [
    "SOL shows significant return signals in multi-horizon evaluation (h=7: p=0.030, h=14: p=0.026).",
    "BTC and SOL provide selective medium-horizon improvements over the naive benchmark.",
    "For ETH, the 365-day robustness window provides more stable VaR behavior than the 60-day setup.",
  ],
};

const THESIS_PREVIEW_VISUALS: Record<
  Language,
  ReadonlyArray<{ src: string; title: string; caption: string }>
> = {
  de: [
    {
      src: "/thesis-preview/forecast-vs-naive.svg",
      title: "Forecast vs. Benchmark",
      caption:
        "Vergleichspfad von ARIMA-GARCH gegen Naive-Benchmark im Out-of-sample-Setup.",
    },
    {
      src: "/thesis-preview/horizon-dm-heatmap.svg",
      title: "Horizon Signal Map",
      caption:
        "Heatmap je Asset/Horizont für relative Signalstärke in der DM-Auswertung.",
    },
    {
      src: "/thesis-preview/var-exceptions.svg",
      title: "VaR Exceptions",
      caption:
        "Expected vs observed 5%-VaR Treffer als kompakte Risiko-Validierungsansicht.",
    },
  ],
  en: [
    {
      src: "/thesis-preview/forecast-vs-naive.svg",
      title: "Forecast vs benchmark",
      caption:
        "Illustrative ARIMA-GARCH path against a naive baseline in out-of-sample mode.",
    },
    {
      src: "/thesis-preview/horizon-dm-heatmap.svg",
      title: "Horizon signal map",
      caption:
        "Asset/horizon heatmap for relative signal strength in DM evaluation.",
    },
    {
      src: "/thesis-preview/var-exceptions.svg",
      title: "VaR exceptions",
      caption:
        "Expected vs observed 5% VaR hits as a compact risk validation snapshot.",
    },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const [thesis, cs] = await Promise.all([getThesis(), getCaseStudyBySlug("thesis")]);
  const viewModel = createThesisViewModel({
    thesis,
    thesisCaseStudy: cs,
    lang,
  });

  return {
    title: viewModel.title || "Thesis",
    description:
      viewModel.summary ||
      (lang === "de"
        ? "Masterarbeit als flagship case study (PDF + Notebook)."
        : "Master’s thesis as a flagship case study (PDF + notebook)."),
    alternates: alternatesForPath({ lang, pathAfterLang: "/thesis" }),
  };
}

export default async function ThesisPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  const [thesis, cs] = await Promise.all([getThesis(), getCaseStudyBySlug("thesis")]);
  const viewModel = createThesisViewModel({
    thesis,
    thesisCaseStudy: cs,
    lang,
  });

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: viewModel.title || "Thesis",
    description: viewModel.summary || viewModel.executiveSummary,
    url: `${siteUrl}/${lang}/thesis`,
    inLanguage: lang,
  };

  return (
    <div className="space-y-10">
      <PlausibleEvent eventName="view_project" eventProps={{ slug: "thesis", lang }} />
      <JsonLd data={jsonLd} />
      <header className="space-y-3">
        <p className="text-xs font-medium text-foreground/70">Thesis</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {viewModel.title || "Thesis"}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-foreground/75">
          {viewModel.summary || viewModel.executiveSummary}
        </p>
        <TranslationFallbackNotice
          lang={lang}
          fallbackFrom={viewModel.fallbackFrom}
          href={
            viewModel.fallbackFrom
              ? `/${viewModel.fallbackFrom}/thesis`
              : `/${lang}/thesis`
          }
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={thesis.pdfPath}
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90"
          >
            {lang === "de" ? "PDF downloaden" : "Download PDF"}
          </a>
          {thesis.notebookPath ? (
            <a
              href={thesis.notebookPath}
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-6 text-sm font-medium text-foreground hover:border-black/20 dark:border-white/15 dark:hover:border-white/25"
            >
              {lang === "de" ? "Notebook ansehen" : "View notebook"}
            </a>
          ) : null}
          <a
            href={THESIS_COLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--accent-cyan)]/45 px-6 text-sm font-medium text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/70 hover:bg-[rgba(53,242,209,0.1)]"
          >
            {lang === "de" ? "Run it live (Colab)" : "Run it live (Colab)"}
          </a>
        </div>
      </header>

      <section className="rounded-3xl border border-black/5 p-6 text-foreground/80 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Executive Summary" : "Executive summary"}
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-foreground/75">
          {viewModel.executiveSummary}
        </p>
      </section>

      {viewModel.method.length ? (
        <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
          <h2 className="text-xl font-semibold tracking-tight">
            {lang === "de" ? "Method" : "Method"}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/80">
            {viewModel.method.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {viewModel.results.length ? (
        <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
          <h2 className="text-xl font-semibold tracking-tight">
            {lang === "de" ? "Results" : "Results"}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/80">
            {viewModel.results.map((item) => (
              <li key={item.text}>
                <span>{item.text}</span>
                {item.qualitative ? (
                  <span className="ml-2 text-xs text-foreground/55">
                    {lang === "de" ? "(qualitativ)" : "(qualitative)"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Cross-Asset Backtest Matrix" : "Cross-asset backtest matrix"}
        </h2>
        <p className="mt-3 max-w-4xl text-sm text-foreground/75">
          {lang === "de"
            ? "Adaptive 60-Tage-Rolling-Ergebnisse aus der Thesis (DM für Forecast-Vergleich, Kupiec/Christoffersen für 5%-VaR, ARCH-LM für Residualdiagnostik)."
            : "Adaptive 60-day rolling results from the thesis (DM for forecast comparison, Kupiec/Christoffersen for 5% VaR, ARCH-LM for residual diagnostics)."}
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
          <table className="min-w-full text-left text-xs text-foreground/80">
            <thead className="bg-black/[0.03] text-foreground/70 dark:bg-white/[0.04]">
              <tr>
                <th className="px-3 py-2 font-medium">Asset</th>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">DM p (price)</th>
                <th className="px-3 py-2 font-medium">DM p (vol)</th>
                <th className="px-3 py-2 font-medium">Kupiec p</th>
                <th className="px-3 py-2 font-medium">Christoffersen p</th>
                <th className="px-3 py-2 font-medium">ARCH-LM p</th>
              </tr>
            </thead>
            <tbody>
              {THESIS_RESULT_ROWS.map((row) => (
                <tr key={row.asset} className="border-t border-black/5 dark:border-white/10">
                  <td className="px-3 py-2 font-semibold">{row.asset}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.model}</td>
                  <td className="px-3 py-2">{row.dmPriceP}</td>
                  <td className="px-3 py-2">{row.dmVolP}</td>
                  <td className="px-3 py-2">{row.kupiecP}</td>
                  <td className="px-3 py-2">{row.christoffersenP}</td>
                  <td className="px-3 py-2">{row.archLmP}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Implementation Setup" : "Implementation setup"}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/80">
          <li>Data source: Yahoo Finance via `yfinance`</li>
          <li>Sample period: 2020-05-11 → 2024-04-20</li>
          <li>Split ratio: 70/15/15 (train/validation/test)</li>
          <li>Forecast horizons: 1, 3, 7, 14, 30 days</li>
          <li>Rolling backtest window: 60 days (robustness: 365 days)</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Static preview visuals" : "Static preview visuals"}
        </h2>
        <p className="mt-3 max-w-4xl text-sm text-foreground/75">
          {lang === "de"
            ? "Diese Mustergrafiken zeigen die Darstellung auf der Website. Die komplette reproduzierbare Ausführung läuft im Colab-Notebook."
            : "These sample visuals show the website preview layer. Full reproducible execution runs in the Colab notebook."}
        </p>
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {THESIS_PREVIEW_VISUALS[lang].map((item) => (
            <article
              key={item.src}
              className="overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
            >
              <img src={item.src} alt={item.title} className="h-auto w-full border-b border-black/5 dark:border-white/10" />
              <div className="space-y-2 p-4">
                <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
                <p className="text-xs text-foreground/70">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Interpretation" : "Interpretation"}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/80">
          {HORIZON_SIGNALS[lang].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Key Visuals" : "Key visuals"}
        </h2>
        {viewModel.architectureKind === "image" && viewModel.architectureImage ? (
          <img
            src={viewModel.architectureImage}
            alt={lang === "de" ? "Thesis Visual" : "Thesis visual"}
            className="mt-4 h-auto w-full rounded-2xl border border-black/5 dark:border-white/10"
          />
        ) : viewModel.architectureText ? (
          viewModel.architectureKind === "mermaid" ? (
            <pre className="mt-4 overflow-auto rounded-2xl border border-black/5 bg-black/[0.02] p-4 text-xs text-foreground/80 dark:border-white/10 dark:bg-white/[0.03]">
              {viewModel.architectureText}
            </pre>
          ) : (
            <p className="mt-3 text-foreground/80">{viewModel.architectureText}</p>
          )
        ) : (
          <p className="mt-3 text-foreground/75">
            {lang === "de"
              ? "Visuals sind im PDF/Notebook enthalten."
              : "Visuals are included in the PDF/notebook."}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-black/5 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "de" ? "Run it live (Colab)" : "Run it live (Colab)"}
        </h2>
        <p className="mt-3 max-w-3xl text-foreground/80">
          {lang === "de"
            ? "Für Recruiter und Interviewer: direkter Start in Colab mit Dependencies, Walkthrough-Zellen und reproduzierbarem Ablauf."
            : "For recruiters and interviewers: direct Colab launch with dependencies, walkthrough cells, and reproducible execution flow."}
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
          <li>
            {lang === "de"
              ? "Notebook in Colab öffnen."
              : "Open the notebook in Colab."}
          </li>
          <li>
            {lang === "de"
              ? "Setup-Zellen für Libraries und Konfiguration ausführen."
              : "Run setup cells for libraries and configuration."}
          </li>
          <li>
            {lang === "de"
              ? "Daten laden und die Sequenz Data → Diagnostics → Models → Backtests durchlaufen."
              : "Run data loading and the sequence Data → Diagnostics → Models → Backtests."}
          </li>
        </ol>
        <div className="mt-5">
          <a
            href={THESIS_COLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-magenta)] px-6 text-sm font-semibold text-[#070a0f] hover:brightness-110"
          >
            {lang === "de" ? "Notebook live ausführen" : "Run notebook live"}
          </a>
        </div>
      </section>

      <section>
        <Link
          href={`/${lang}/projects`}
          className="text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          ← {lang === "de" ? "Zu Projekten" : "Back to projects"}
        </Link>
      </section>
    </div>
  );
}
