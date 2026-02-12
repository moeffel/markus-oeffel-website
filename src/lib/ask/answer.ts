import { getCaseStudies, getExperience, getThesis } from "@/lib/content";
import { openAiChatCompletion } from "@/lib/ai/openai";
import { buildAskPrompt } from "@/lib/ask/prompt";
import type { CaseStudy } from "@/lib/content/schemas";
import type { Language } from "@/lib/i18n";

export type AskCitation = {
  doc_id: string;
  title: string;
  section_id: string;
  snippet: string;
};

export type AskSuggestedLink = {
  label: string;
  href: string;
};

export type AskResponse = {
  answer: string;
  citations: AskCitation[];
  suggested_links: AskSuggestedLink[];
};

type CorpusChunk = {
  docId: string;
  title: string;
  href?: string;
  sectionId: string;
  text: string;
};

function clamp(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1))}…`;
}

function toTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function score(queryTokens: string[], chunkTokens: string[]): number {
  if (queryTokens.length === 0 || chunkTokens.length === 0) return 0;
  const chunkSet = new Set(chunkTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (chunkSet.has(token)) hits += 1;
  }
  return hits;
}

function chunkCaseStudy(caseStudy: CaseStudy, lang: Language): CorpusChunk[] {
  const docId = `case_study:${caseStudy.slug}`;
  const title = caseStudy.title[lang];
  const href =
    caseStudy.slug === "thesis" ? `/${lang}/thesis` : `/${lang}/projects/${caseStudy.slug}`;

  const chunks: CorpusChunk[] = [
    {
      docId,
      title,
      href,
      sectionId: "summary",
      text: caseStudy.summary[lang],
    },
    {
      docId,
      title,
      href,
      sectionId: "problem",
      text: caseStudy.problem[lang],
    },
    {
      docId,
      title,
      href,
      sectionId: "solution",
      text: caseStudy.solution[lang].join("\n"),
    },
    {
      docId,
      title,
      href,
      sectionId: "impact",
      text: caseStudy.impact[lang].map((i) => i.text).join("\n"),
    },
    {
      docId,
      title,
      href,
      sectionId: "constraints",
      text: caseStudy.constraints[lang].join("\n"),
    },
    {
      docId,
      title,
      href,
      sectionId: "role",
      text: caseStudy.yourRole[lang].join("\n"),
    },
  ];

  if (caseStudy.architecture?.type === "text") {
    chunks.push({
      docId,
      title,
      href,
      sectionId: "architecture",
      text: caseStudy.architecture.payload[lang],
    });
  }

  if (caseStudy.learnings) {
    chunks.push({
      docId,
      title,
      href,
      sectionId: "learnings",
      text: caseStudy.learnings[lang].join("\n"),
    });
  }

  return chunks;
}

async function buildCorpus(lang: Language): Promise<CorpusChunk[]> {
  const chunks: CorpusChunk[] = [];

  const [caseStudies, thesis, experience] = await Promise.all([
    getCaseStudies({ publishedOnly: true }),
    getThesis(),
    getExperience(),
  ]);

  for (const cs of caseStudies) {
    chunks.push(...chunkCaseStudy(cs, lang));
  }

  chunks.push({
    docId: "thesis:overview",
    title: thesis.title[lang],
    href: `/${lang}/thesis`,
    sectionId: "summary",
    text: thesis.summary[lang],
  });

  for (const [i, item] of experience.entries()) {
    chunks.push({
      docId: `experience:${i}`,
      title: `${item.role[lang]}${item.org ? ` @ ${item.org}` : ""}`,
      href: `/${lang}/experience`,
      sectionId: "outcomes",
      text: item.outcomes[lang].join("\n"),
    });
  }

  return chunks;
}

function makeSnippet(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177)}…`;
}

function baseAnswerFromRanked(input: {
  lang: Language;
  ranked: Array<{ chunk: CorpusChunk; score: number }>;
}): string {
  const topTitles = Array.from(
    new Set(input.ranked.map((r) => r.chunk.title).filter(Boolean)),
  ).slice(0, 3);

  return input.lang === "de"
    ? `Relevante Stellen in meinem Portfolio: ${topTitles.join(
        ", ",
      )}. Unten findest du die Quellenstellen (Citations).`
    : `Relevant parts of my portfolio: ${topTitles.join(
        ", ",
      )}. See citations below.`;
}

function sourcesFromRanked(ranked: Array<{ chunk: CorpusChunk; score: number }>): string {
  return ranked
    .slice(0, 8)
    .map((r, idx) => {
      const c = r.chunk;
      return [
        `SOURCE ${idx + 1}`,
        `doc_id: ${c.docId}`,
        `title: ${c.title}`,
        `section_id: ${c.sectionId}`,
        `text: ${clamp(c.text, 1200)}`,
      ].join("\n");
    })
    .join("\n\n");
}

export async function answerFromCorpus(input: {
  query: string;
  lang: Language;
}): Promise<AskResponse> {
  const query = input.query.trim();
  const queryTokens = toTokens(query);
  const corpus = await buildCorpus(input.lang);

  const ranked = corpus
    .map((chunk) => ({
      chunk,
      score: score(queryTokens, toTokens(chunk.text)),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (ranked.length === 0) {
    const answer =
      input.lang === "de"
        ? "Ich kann nur aus diesem Portfolio beantworten. Probier eine Frage zu Projekten, Thesis, Risk/Fraud, KYC oder Architektur."
        : "I can only answer from this portfolio. Try a question about projects, the thesis, risk/fraud, KYC, or architecture.";
    return {
      answer,
      citations: [],
      suggested_links: [
        { label: input.lang === "de" ? "Projekte" : "Projects", href: `/${input.lang}/projects` },
        { label: input.lang === "de" ? "Thesis" : "Thesis", href: `/${input.lang}/thesis` },
        { label: input.lang === "de" ? "Kontakt" : "Contact", href: `/${input.lang}/contact` },
      ],
    };
  }

  const answer = baseAnswerFromRanked({ lang: input.lang, ranked });

  const citations: AskCitation[] = ranked.map(({ chunk }) => ({
    doc_id: chunk.docId,
    title: chunk.title,
    section_id: chunk.sectionId,
    snippet: makeSnippet(chunk.text),
  }));

  const suggested_links: AskSuggestedLink[] = Array.from(
    new Map(
      ranked
        .map((r) => r.chunk)
        .filter((c) => Boolean(c.href))
        .map((c) => [
          c.href!,
          { label: c.title, href: c.href! } satisfies AskSuggestedLink,
        ]),
    ).values(),
  ).slice(0, 4);

  return { answer, citations, suggested_links };
}

export async function answerFromCorpusWithLlm(input: {
  query: string;
  lang: Language;
}): Promise<AskResponse> {
  const query = input.query.trim();
  const queryTokens = toTokens(query);
  const corpus = await buildCorpus(input.lang);

  const ranked = corpus
    .map((chunk) => ({
      chunk,
      score: score(queryTokens, toTokens(chunk.text)),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (ranked.length === 0) {
    return await answerFromCorpus(input);
  }

  const citations: AskCitation[] = ranked.slice(0, 6).map(({ chunk }) => ({
    doc_id: chunk.docId,
    title: chunk.title,
    section_id: chunk.sectionId,
    snippet: makeSnippet(chunk.text),
  }));

  const suggested_links: AskSuggestedLink[] = Array.from(
    new Map(
      ranked
        .map((r) => r.chunk)
        .filter((c) => Boolean(c.href))
        .map((c) => [
          c.href!,
          { label: c.title, href: c.href! } satisfies AskSuggestedLink,
        ]),
    ).values(),
  ).slice(0, 4);

  const sources = sourcesFromRanked(ranked);
  const prompt = buildAskPrompt({ lang: input.lang, query, sources });

  try {
    const answer = await openAiChatCompletion({
      system: prompt.system,
      user: prompt.user,
      temperature: 0.2,
      maxTokens: Number(process.env.ASK_MAX_TOKENS ?? 450),
    });
    return { answer, citations, suggested_links };
  } catch (err) {
    console.error("[ask] corpus+llm failed; falling back to local answer.", err);
    const answer = baseAnswerFromRanked({ lang: input.lang, ranked });
    return { answer, citations, suggested_links };
  }
}
