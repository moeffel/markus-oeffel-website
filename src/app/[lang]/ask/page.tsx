import type { Metadata } from "next";

import type { Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

import { AskClient } from "./ask-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: "Ask me anything",
    description:
      lang === "de"
        ? "Stell Fragen zu Werdegang, Projekten, Thesis und Skills – Antworten mit Quellen."
        : "Ask about career, projects, thesis, and skills — answers with citations.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/ask" }),
  };
}

export default async function AskPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {lang === "de" ? "Ask me anything" : "Ask me anything"}
        </h1>
        <p className="max-w-2xl text-pretty text-foreground/70">
          {lang === "de"
            ? "Frag zu Werdegang, Projekten, Thesis oder Skills. Antworten kommen mit Quellen."
            : "Ask about career, projects, thesis, or skills. Answers come with citations."}
        </p>
      </header>

      <AskClient lang={lang} />
    </div>
  );
}
