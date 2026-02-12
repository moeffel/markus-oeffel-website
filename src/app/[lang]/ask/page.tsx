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
    title: "Ask",
    description:
      lang === "de"
        ? "Stell Fragen zu meinen Projekten – Antworten mit Citations."
        : "Ask about my work – answers with citations.",
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
          {lang === "de" ? "Ask my work" : "Ask my work"}
        </h1>
        <p className="max-w-2xl text-pretty text-foreground/70">
          {lang === "de"
            ? "Frag mich zu Projekten, Thesis oder Architektur. Antworten kommen mit Citations."
            : "Ask about projects, the thesis, or architecture. Answers come with citations."}
        </p>
      </header>

      <AskClient lang={lang} />
    </div>
  );
}
