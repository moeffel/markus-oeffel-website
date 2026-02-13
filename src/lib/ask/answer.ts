import { openAiChatCompletion } from "@/lib/ai/openai";
import { buildAskPrompt } from "@/lib/ask/prompt";
import {
  getCaseStudies,
  getExperience,
  getHowIWorkPrinciples,
  getSkillCategories,
  getThesis,
} from "@/lib/content";
import type { CaseStudy } from "@/lib/content/schemas";
import { LANDING_COPY } from "@/lib/content/site-copy";
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

type RankedChunk = {
  chunk: CorpusChunk;
  score: number;
};

type QueryIntent = {
  skills: boolean;
  thesis: boolean;
  website: boolean;
  profile: boolean;
  stepByStep: boolean;
};

const SECTION_LABELS: Record<Language, Record<string, string>> = {
  de: {
    summary: "Zusammenfassung",
    problem: "Problem",
    solution: "Lösung",
    impact: "Impact",
    constraints: "Rahmenbedingungen",
    role: "Rolle",
    architecture: "Architektur",
    learnings: "Learnings",
    outcomes: "Outcomes",
    details: "Details",
    principle: "Arbeitsprinzip",
    profile: "Profil",
    ask: "Ask",
  },
  en: {
    summary: "Summary",
    problem: "Problem",
    solution: "Solution",
    impact: "Impact",
    constraints: "Constraints",
    role: "Role",
    architecture: "Architecture",
    learnings: "Learnings",
    outcomes: "Outcomes",
    details: "Details",
    principle: "Work principle",
    profile: "Profile",
    ask: "Ask",
  },
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "what",
  "which",
  "with",
  "zu",
  "der",
  "die",
  "das",
  "ein",
  "eine",
  "und",
  "oder",
  "mit",
  "von",
  "im",
  "in",
  "auf",
  "für",
  "wie",
  "was",
  "welche",
  "welcher",
  "welches",
  "dein",
  "deine",
  "deinen",
  "du",
  "ist",
  "sind",
  "ich",
  "mich",
  "über",
  "about",
  "your",
]);

const WEBSITE_CASE_DOC_ID = "case_study:markus-oeffel-website";

function clamp(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1))}…`;
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function toTokens(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function hasPrefixMatch(token: string, candidates: readonly string[]): boolean {
  return candidates.some(
    (candidate) =>
      candidate.startsWith(token) ||
      token.startsWith(candidate),
  );
}

function sectionLabel(sectionId: string, lang: Language): string {
  return SECTION_LABELS[lang][sectionId] ?? sectionId;
}

function makeSnippet(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 190) return clean;
  return `${clean.slice(0, 187)}…`;
}

function parseQueryIntent(input: {
  query: string;
  queryTokens: readonly string[];
}): QueryIntent {
  const normalizedQuery = normalize(input.query);
  const hasToken = (tokens: readonly string[]) =>
    tokens.some((token) => input.queryTokens.includes(token));
  const hasPhrase = (phrases: readonly string[]) =>
    phrases.some((phrase) => normalizedQuery.includes(phrase));

  const skills =
    hasToken([
      "skill",
      "skills",
      "zertifikat",
      "zertifikate",
      "certificate",
      "certificates",
      "certification",
      "msc",
      "bsc",
      "degree",
      "degrees",
      "abschluss",
      "abschlüsse",
      "wko",
      "exam",
      "prüfung",
    ]) ||
    hasPhrase([
      "commercial asset advisor",
      "vermogensberater",
      "vermögensberater",
      "google advanced data analytics",
      "data analyst in python",
    ]);

  const thesis =
    hasToken([
      "thesis",
      "masterarbeit",
      "arima",
      "garch",
      "var",
      "backtest",
      "backtests",
      "rolling",
      "method",
      "methode",
    ]) ||
    hasPhrase(["step by step", "schritt für schritt"]);

  const website =
    hasToken([
      "website",
      "portfolio",
      "nextjs",
      "deployment",
      "deploy",
      "vercel",
      "playwright",
    ]) || hasPhrase(["markus oeffel s website", "markus öffel s website"]);

  const profile =
    hasToken([
      "about",
      "profil",
      "profile",
      "experience",
      "werdegang",
      "career",
      "background",
      "product",
      "owner",
    ]) ||
    hasPhrase(["who are you", "tell me about yourself"]);

  const stepByStep =
    hasToken(["step", "steps", "methode", "method", "ablauf", "setup"]) ||
    hasPhrase(["step by step", "schritt für schritt"]);

  return { skills, thesis, website, profile, stepByStep };
}

function classifyDocGroup(docId: string): string {
  if (docId.startsWith("skills:")) return "skills";
  if (docId.startsWith("thesis:")) return "thesis";
  if (docId === "case_study:thesis") return "thesis";
  if (docId.startsWith("case_study:")) return "case_study";
  if (docId.startsWith("experience:")) return "experience";
  if (docId.startsWith("landing:")) return "landing";
  if (docId.startsWith("how_i_work:")) return "principles";
  return "other";
}

function textContainsAny(input: {
  haystack: string;
  needles: readonly string[];
}): boolean {
  return input.needles.some((needle) => input.haystack.includes(needle));
}

function scoreChunk(input: {
  queryTokens: readonly string[];
  intent: QueryIntent;
  chunk: CorpusChunk;
}): number {
  const { queryTokens, chunk, intent } = input;
  if (queryTokens.length === 0) return 0;

  const chunkTokens = toTokens(`${chunk.title} ${chunk.sectionId} ${chunk.text}`);
  if (chunkTokens.length === 0) return 0;
  const chunkTokenSet = new Set(chunkTokens);

  let exact = 0;
  let partial = 0;
  for (const token of queryTokens) {
    if (chunkTokenSet.has(token)) exact += 1;
    else if (hasPrefixMatch(token, chunkTokens)) partial += 1;
  }

  const docGroup = classifyDocGroup(chunk.docId);
  const normalizedChunkText = normalize(`${chunk.title} ${chunk.text}`);

  let intentBoost = 0;
  if (intent.skills) {
    if (docGroup === "skills") intentBoost += 3.2;
    if (docGroup === "experience") intentBoost += 1.1;
    if (
      textContainsAny({
        haystack: normalizedChunkText,
        needles: [
          "certificate",
          "certification",
          "zertifikat",
          "wko",
          "commercial asset advisor",
          "msc",
          "bsc",
          "degree",
          "abschluss",
        ],
      })
    ) {
      intentBoost += 2;
    }
  }

  if (intent.thesis) {
    if (docGroup === "thesis") intentBoost += 3;
    if (chunk.docId === "case_study:thesis") intentBoost += 2.4;
    if (["solution", "architecture", "summary", "impact"].includes(chunk.sectionId)) {
      intentBoost += 0.9;
    }
  }

  if (intent.stepByStep && ["solution", "architecture"].includes(chunk.sectionId)) {
    intentBoost += 1.1;
  }

  if (intent.profile && docGroup === "experience") {
    intentBoost += 1.6;
  }

  if (intent.website && chunk.docId === WEBSITE_CASE_DOC_ID) {
    intentBoost += 2.2;
  }

  if (!intent.website && chunk.docId === WEBSITE_CASE_DOC_ID) {
    intentBoost -= 1.3;
  }

  const exactRatio = exact / queryTokens.length;
  const partialRatio = partial / queryTokens.length;
  const textLengthPenalty = chunk.text.length > 1600 ? 0.2 : 0;

  return (
    exact * 2 +
    partial * 0.75 +
    exactRatio * 1.1 +
    partialRatio * 0.45 +
    (chunk.href ? 0.1 : 0) +
    intentBoost -
    textLengthPenalty
  );
}

function diversifyRankedChunks(input: {
  ranked: RankedChunk[];
  intent: QueryIntent;
}): RankedChunk[] {
  const selected: RankedChunk[] = [];
  const perDoc = new Map<string, number>();
  const perGroup = new Map<string, number>();

  const maxPerDoc = input.intent.website ? 3 : 2;
  const maxPerGroup = input.intent.website ? 5 : 4;

  for (const entry of input.ranked) {
    const docCount = perDoc.get(entry.chunk.docId) ?? 0;
    const group = classifyDocGroup(entry.chunk.docId);
    const groupCount = perGroup.get(group) ?? 0;

    if (docCount >= maxPerDoc) continue;
    if (groupCount >= maxPerGroup) continue;

    selected.push(entry);
    perDoc.set(entry.chunk.docId, docCount + 1);
    perGroup.set(group, groupCount + 1);

    if (selected.length >= 10) break;
  }

  return selected;
}

function rankCorpus(input: {
  query: string;
  corpus: readonly CorpusChunk[];
}): RankedChunk[] {
  const queryTokens = toTokens(input.query);
  if (queryTokens.length === 0) return [];
  const intent = parseQueryIntent({
    query: input.query,
    queryTokens,
  });

  const ranked = input.corpus
    .map((chunk) => ({
      chunk,
      score: scoreChunk({ queryTokens, intent, chunk }),
    }))
    .filter((entry) => entry.score > 0.35)
    .sort((a, b) => b.score - a.score);

  return diversifyRankedChunks({ ranked, intent });
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

  const [caseStudies, thesis, experience, skillCategories, workPrinciples] =
    await Promise.all([
      getCaseStudies({ publishedOnly: true }),
      getThesis(),
      getExperience(),
      getSkillCategories(),
      getHowIWorkPrinciples(),
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

  for (const [catIndex, category] of skillCategories.entries()) {
    for (const [itemIndex, item] of category.items.entries()) {
      chunks.push({
        docId: `skills:${catIndex}:${itemIndex}`,
        title: category.title[lang],
        href: `/${lang}/skills`,
        sectionId: "details",
        text: `${item.name}\n${item.note[lang]}`,
      });
    }
  }

  for (const [index, principle] of workPrinciples.entries()) {
    chunks.push({
      docId: `how_i_work:${index}`,
      title: principle.title[lang],
      href: `/${lang}/skills`,
      sectionId: "principle",
      text: principle.body[lang],
    });
  }

  const landing = LANDING_COPY[lang];
  chunks.push({
    docId: "landing:about",
    title: landing.aboutTitle,
    href: `/${lang}`,
    sectionId: "profile",
    text: [landing.aboutSubtitle, ...landing.aboutParagraphs, ...landing.aboutHighlights].join("\n"),
  });
  chunks.push({
    docId: "landing:ask",
    title: landing.askTitle,
    href: `/${lang}/ask`,
    sectionId: "ask",
    text: [landing.askSubtitle, ...landing.askExamplePrompts, ...landing.ragGuardrails].join("\n"),
  });

  return chunks;
}

function sourcesFromRanked(ranked: RankedChunk[]): string {
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

function buildCitations(ranked: RankedChunk[]): AskCitation[] {
  return ranked.slice(0, 6).map(({ chunk }) => ({
    doc_id: chunk.docId,
    title: chunk.title,
    section_id: chunk.sectionId,
    snippet: makeSnippet(chunk.text),
  }));
}

function buildSuggestedLinks(ranked: RankedChunk[]): AskSuggestedLink[] {
  return Array.from(
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
}

function buildLocalAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const top = input.ranked.slice(0, 4);
  const bullets = top
    .map(
      ({ chunk }) =>
        `- **${chunk.title} · ${sectionLabel(chunk.sectionId, input.lang)}**: ${makeSnippet(chunk.text)}`,
    )
    .join("\n");

  const intro =
    input.lang === "de"
      ? `Ich habe ${top.length} relevante Stellen in deinem Portfolio gefunden:`
      : `I found ${top.length} relevant sections in your portfolio:`;

  const outro =
    input.lang === "de"
      ? "Wenn du tiefer gehen willst, frag nach Details zu Methode, Tools oder konkreten Ergebnissen."
      : "If you want to go deeper, ask for details on method, tools, or concrete outcomes.";

  return `${intro}\n\n${bullets}\n\n${outro}`;
}

function emptyResult(lang: Language): AskResponse {
  return {
    answer:
      lang === "de"
        ? "Ich kann nur aus diesem Portfolio beantworten. Frag z. B. zu Masterarbeit, Studieninhalten, Zertifikaten oder Projekten."
        : "I can only answer from this portfolio. Try asking about the thesis, degree content, certificates, or projects.",
    citations: [],
    suggested_links: [
      { label: lang === "de" ? "Projekte" : "Projects", href: `/${lang}/projects` },
      { label: lang === "de" ? "Thesis" : "Thesis", href: `/${lang}/thesis` },
      { label: lang === "de" ? "Skills" : "Skills", href: `/${lang}/skills` },
      { label: lang === "de" ? "Kontakt" : "Contact", href: `/${lang}/contact` },
    ],
  };
}

export async function answerFromCorpus(input: {
  query: string;
  lang: Language;
}): Promise<AskResponse> {
  const query = input.query.trim();
  const corpus = await buildCorpus(input.lang);
  const ranked = rankCorpus({ query, corpus });

  if (ranked.length === 0) {
    return emptyResult(input.lang);
  }

  return {
    answer: buildLocalAnswer({ lang: input.lang, ranked }),
    citations: buildCitations(ranked),
    suggested_links: buildSuggestedLinks(ranked),
  };
}

export async function answerFromCorpusWithLlm(input: {
  query: string;
  lang: Language;
}): Promise<AskResponse> {
  const query = input.query.trim();
  const corpus = await buildCorpus(input.lang);
  const ranked = rankCorpus({ query, corpus });

  if (ranked.length === 0) {
    return emptyResult(input.lang);
  }

  const citations = buildCitations(ranked);
  const suggested_links = buildSuggestedLinks(ranked);
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
    return {
      answer: buildLocalAnswer({ lang: input.lang, ranked }),
      citations,
      suggested_links,
    };
  }
}
