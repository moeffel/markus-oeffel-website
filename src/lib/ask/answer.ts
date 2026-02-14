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
import { CONTACT_COPY, LANDING_COPY, LEGAL_COPY } from "@/lib/content/site-copy";
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
  rag: boolean;
  profile: boolean;
  sensitivePersonal: boolean;
  stepByStep: boolean;
  contact: boolean;
  legal: boolean;
  years: readonly string[];
};

type RankResult = {
  ranked: RankedChunk[];
  intent: QueryIntent;
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
    timeline: "Timeline",
    details: "Details",
    principle: "Arbeitsprinzip",
    profile: "Profil",
    ask: "Ask",
    copy: "Kontakt",
    legal: "Recht",
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
    timeline: "Timeline",
    details: "Details",
    principle: "Work principle",
    profile: "Profile",
    ask: "Ask",
    copy: "Contact",
    legal: "Legal",
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

function extractYearTokens(text: string): string[] {
  return Array.from(new Set(text.match(/\b(?:19|20)\d{2}\b/g) ?? []));
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
      "rag",
      "assistant",
      "ask",
      "citations",
      "citation",
      "vector",
      "embedding",
      "llm",
    ]) || hasPhrase(["markus oeffel s website", "markus öffel s website"]);

  const rag =
    hasToken([
      "rag",
      "assistant",
      "ask",
      "prompt",
      "citations",
      "citation",
      "vector",
      "embedding",
      "retrieval",
      "context",
      "source",
      "sources",
    ]) ||
    hasPhrase([
      "ask me anything",
      "retrieval augmented generation",
      "with citations",
      "mit citations",
    ]);

  const profile =
    hasToken([
      "about",
      "profil",
      "profile",
      "experience",
      "werdegang",
      "career",
      "background",
      "profession",
      "job",
      "work",
      "worked",
      "role",
      "position",
      "beruf",
      "rolle",
      "station",
      "product",
      "owner",
    ]) ||
    hasPhrase([
      "who are you",
      "tell me about yourself",
      "wer bist du",
      "what was your profession",
    ]);

  const sensitivePersonal =
    hasToken([
      "alt",
      "age",
      "born",
      "geburt",
      "geburtsdatum",
      "birthday",
      "birth",
      "wohnort",
      "adresse",
      "address",
      "telefon",
      "phone",
      "familie",
      "family",
    ]) ||
    hasPhrase([
      "wie alt",
      "how old",
      "date of birth",
      "where do you live",
      "wo wohnst du",
      "what is your address",
    ]);

  const stepByStep =
    hasToken(["step", "steps", "methode", "method", "ablauf", "setup"]) ||
    hasPhrase(["step by step", "schritt für schritt"]);
  const contact =
    hasToken(["contact", "kontakt", "email", "mail", "reach", "anfrage", "message"]) ||
    hasPhrase(["how can i contact", "wie kann ich dich kontaktieren"]);
  const legal =
    hasToken(["privacy", "datenschutz", "imprint", "impressum", "legal", "gdpr"]) ||
    hasPhrase(["data protection", "legal notice"]);

  const years = extractYearTokens(normalizedQuery);

  return {
    skills,
    thesis,
    website,
    rag,
    profile,
    sensitivePersonal,
    stepByStep,
    contact,
    legal,
    years,
  };
}

function classifyDocGroup(docId: string): string {
  if (docId.startsWith("skills:")) return "skills";
  if (docId.startsWith("thesis:")) return "thesis";
  if (docId === "case_study:thesis") return "thesis";
  if (docId.startsWith("case_study:")) return "case_study";
  if (docId.startsWith("experience:")) return "experience";
  if (docId.startsWith("landing:")) return "landing";
  if (docId.startsWith("how_i_work:")) return "principles";
  if (docId === "page:contact") return "contact";
  if (docId.startsWith("page:/")) return "legal";
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
    if (chunk.sectionId === "timeline" || chunk.sectionId === "role") {
      intentBoost += 0.8;
    }
  }

  if (intent.profile && intent.years.length > 0) {
    const hasMatchingYear = intent.years.some((year) =>
      normalizedChunkText.includes(year),
    );
    if (docGroup === "experience") {
      intentBoost += hasMatchingYear ? 2.4 : -0.2;
    } else if (hasMatchingYear) {
      intentBoost -= 0.3;
    } else {
      intentBoost -= 1.2;
    }
  }

  if (intent.contact && chunk.docId === "page:contact") {
    intentBoost += 2.3;
  }

  if (
    intent.legal &&
    [
      "page:/en/privacy",
      "page:/de/datenschutz",
      "page:/en/imprint",
      "page:/de/impressum",
    ].includes(chunk.docId)
  ) {
    intentBoost += 2.2;
  }

  if (intent.website && chunk.docId === WEBSITE_CASE_DOC_ID) {
    intentBoost += 2.2;
  }

  if (intent.rag) {
    if (chunk.docId === "landing:ask") intentBoost += 2;
    if (chunk.docId === WEBSITE_CASE_DOC_ID) intentBoost += 1.2;
    if (chunk.docId === "page:contact" || chunk.docId.startsWith("page:/")) {
      intentBoost -= 0.4;
    }
  }

  if (!intent.website && chunk.docId === WEBSITE_CASE_DOC_ID) {
    intentBoost -= 3.2;
  }

  if (intent.skills && chunk.sectionId === "details") {
    intentBoost += 0.7;
  }

  if (intent.thesis && chunk.sectionId === "solution") {
    intentBoost += 1;
  }

  if (!intent.contact && chunk.docId === "page:contact") {
    intentBoost -= 0.6;
  }

  if (!intent.legal && chunk.docId.startsWith("page:/")) {
    intentBoost -= 0.35;
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

  const maxPerDoc = input.intent.website ? 3 : input.intent.profile ? 3 : 2;
  const maxPerGroup = input.intent.website ? 5 : input.intent.profile ? 6 : 4;

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
}): RankResult {
  const queryTokens = toTokens(input.query);
  if (queryTokens.length === 0) {
    return {
      ranked: [],
      intent: {
        skills: false,
        thesis: false,
        website: false,
        rag: false,
        profile: false,
        sensitivePersonal: false,
        stepByStep: false,
        contact: false,
        legal: false,
        years: [],
      },
    };
  }
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

  return {
    ranked: diversifyRankedChunks({ ranked, intent }),
    intent,
  };
}

type MatchStats = {
  exact: number;
  partial: number;
  exactRatio: number;
  group: string;
};

function computeMatchStats(input: {
  queryTokens: readonly string[];
  chunk: CorpusChunk;
}): MatchStats {
  const chunkTokens = toTokens(
    `${input.chunk.title} ${input.chunk.sectionId} ${input.chunk.text}`,
  );
  const chunkTokenSet = new Set(chunkTokens);

  let exact = 0;
  let partial = 0;
  for (const token of input.queryTokens) {
    if (chunkTokenSet.has(token)) exact += 1;
    else if (hasPrefixMatch(token, chunkTokens)) partial += 1;
  }

  const exactRatio =
    input.queryTokens.length > 0 ? exact / input.queryTokens.length : 0;

  return {
    exact,
    partial,
    exactRatio,
    group: classifyDocGroup(input.chunk.docId),
  };
}

function hasSufficientEvidence(input: {
  query: string;
  queryTokens: readonly string[];
  intent: QueryIntent;
  ranked: readonly RankedChunk[];
}): boolean {
  if (input.ranked.length === 0) return false;

  const inspected = input.ranked.slice(0, 8);
  const stats = inspected.map((entry) =>
    computeMatchStats({ queryTokens: input.queryTokens, chunk: entry.chunk }),
  );
  const nonLandingStats = stats.filter(
    (entry) => entry.group !== "landing" && entry.group !== "other",
  );

  if (nonLandingStats.length === 0) return false;

  const maxExact = Math.max(0, ...nonLandingStats.map((entry) => entry.exact));
  const maxExactRatio = Math.max(
    0,
    ...nonLandingStats.map((entry) => entry.exactRatio),
  );
  const hasStrongMatch = nonLandingStats.some(
    (entry) =>
      entry.exact >= 2 ||
      entry.exactRatio >= 0.66 ||
      (entry.exact >= 1 && entry.partial >= 1),
  );

  if (input.queryTokens.length === 1 && maxExact < 1) {
    return false;
  }

  if (input.queryTokens.length >= 2 && maxExact < 2 && maxExactRatio < 0.66) {
    return false;
  }

  if (input.queryTokens.length >= 4 && !hasStrongMatch) {
    return false;
  }

  if (input.intent.profile && input.intent.years.length > 0) {
    const hasExperienceYearEvidence = input.ranked.some(
      (entry) =>
        entry.chunk.docId.startsWith("experience:") &&
        input.intent.years.some((year) =>
          `${entry.chunk.title}\n${entry.chunk.text}`.includes(year),
        ),
    );
    if (!hasExperienceYearEvidence) return false;
  }

  if (input.intent.skills) {
    const hasSkillEvidence = input.ranked.some((entry) => {
      if (!entry.chunk.docId.startsWith("skills:")) return false;
      const match = computeMatchStats({
        queryTokens: input.queryTokens,
        chunk: entry.chunk,
      });
      return match.exact >= 1 || match.partial >= 1;
    });
    if (!hasSkillEvidence) return false;
  }

  if (input.intent.thesis) {
    const hasThesisEvidence = input.ranked.some((entry) => {
      if (!["thesis", "case_study"].includes(classifyDocGroup(entry.chunk.docId))) {
        return false;
      }
      const match = computeMatchStats({
        queryTokens: input.queryTokens,
        chunk: entry.chunk,
      });
      return match.exact >= 1 || match.partial >= 1;
    });
    if (!hasThesisEvidence) return false;
  }

  if (input.intent.sensitivePersonal) {
    const hasSensitiveEvidence = input.ranked.some((entry) =>
      /(age|alt|born|birth|geburt|geburtsdatum|birthday|wohnort|address|adresse|telefon|phone)/i.test(
        `${entry.chunk.title}\n${entry.chunk.text}`,
      ),
    );
    if (!hasSensitiveEvidence) return false;
  }

  return true;
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
    const timelineLines = [
      `${lang === "de" ? "Rolle" : "Role"}: ${item.role[lang]}`,
      item.org ? `${lang === "de" ? "Organisation" : "Organization"}: ${item.org}` : null,
      `${lang === "de" ? "Zeitraum" : "Period"}: ${item.period}`,
      item.domains.length
        ? `${lang === "de" ? "Domänen" : "Domains"}: ${item.domains.join(", ")}`
        : null,
      item.tech.length ? `${lang === "de" ? "Tech" : "Tech"}: ${item.tech.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    chunks.push({
      docId: `experience:${i}`,
      title: `${item.role[lang]}${item.org ? ` @ ${item.org}` : ""}`,
      href: `/${lang}/experience`,
      sectionId: "timeline",
      text: timelineLines,
    });
    chunks.push({
      docId: `experience:${i}`,
      title: `${item.role[lang]}${item.org ? ` @ ${item.org}` : ""}`,
      href: `/${lang}/experience`,
      sectionId: "outcomes",
      text: [
        `${lang === "de" ? "Outcomes" : "Outcomes"}:`,
        ...item.outcomes[lang],
      ].join("\n"),
    });
  }

  for (const [catIndex, category] of skillCategories.entries()) {
    for (const [itemIndex, item] of category.items.entries()) {
      const note = item.note?.[lang] ?? "";
      chunks.push({
        docId: `skills:${catIndex}:${itemIndex}`,
        title: category.title[lang],
        href: `/${lang}/skills`,
        sectionId: "details",
        text: note ? `${item.name}\n${note}` : item.name,
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
    docId: "landing:proof",
    title: landing.headline,
    href: `/${lang}`,
    sectionId: "profile",
    text: [landing.sub, ...landing.proofChips, ...landing.trustPoints].join("\n"),
  });
  chunks.push({
    docId: "landing:ask",
    title: landing.askTitle,
    href: `/${lang}/ask`,
    sectionId: "ask",
    text: [landing.askSubtitle, ...landing.askExamplePrompts, ...landing.ragGuardrails].join("\n"),
  });
  chunks.push({
    docId: "landing:focus",
    title: landing.focusTitle,
    href: `/${lang}`,
    sectionId: "details",
    text: landing.focusAreas
      .map((focus) => `${focus.title}: ${focus.note}`)
      .join("\n"),
  });
  const contact = CONTACT_COPY[lang];
  chunks.push({
    docId: "page:contact",
    title: contact.title,
    href: `/${lang}/contact`,
    sectionId: "copy",
    text: [
      contact.subtitle,
      ...contact.contactNotes,
    ].join("\n"),
  });

  const legalPages =
    lang === "de"
      ? [
          { docId: "page:/de/impressum", page: LEGAL_COPY.impressum_de },
          { docId: "page:/de/datenschutz", page: LEGAL_COPY.datenschutz_de },
        ]
      : [
          { docId: "page:/en/imprint", page: LEGAL_COPY.imprint_en },
          { docId: "page:/en/privacy", page: LEGAL_COPY.privacy_en },
        ];

  for (const legalPage of legalPages) {
    const sectionLines = legalPage.page.sections.flatMap((section) => {
      const description = ("description" in section ? section.description : "") ?? "";
      const paragraphs = ("paragraphs" in section ? section.paragraphs : []) ?? [];
      const listItems = ("listItems" in section ? section.listItems : []) ?? [];
      const infoItems = ("infoItems" in section ? section.infoItems : []) ?? [];

      return [
        section.title,
        description,
        ...paragraphs,
        ...listItems,
        ...infoItems.map((item) => `${item.label}: ${item.value}`),
      ];
    });

    const legalText = [
      legalPage.page.subtitle,
      ...sectionLines,
      legalPage.page.note ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    chunks.push({
      docId: legalPage.docId,
      title: legalPage.page.title,
      href: legalPage.page.href,
      sectionId: "legal",
      text: legalText,
    });
  }

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

function pickProfileRankedContext(input: {
  ranked: RankedChunk[];
  intent: QueryIntent;
  query: string;
}): RankedChunk[] {
  const intent = input.intent;
  if (!intent || !intent.profile) return input.ranked;

  const years = intent.years.length
    ? intent.years
    : extractYearTokens(normalize(input.query));
  const experienceRanked = input.ranked.filter((entry) =>
    entry.chunk.docId.startsWith("experience:"),
  );

  if (experienceRanked.length === 0) return input.ranked;
  if (years.length === 0) return experienceRanked;

  const timelineYearMatches = experienceRanked.filter((entry) => {
    const text = `${entry.chunk.title}\n${entry.chunk.sectionId}\n${entry.chunk.text}`;
    return years.some((year) => text.includes(year));
  });

  if (timelineYearMatches.length === 0) return experienceRanked;

  const ordered: RankedChunk[] = [];
  const seen = new Set<string>();
  for (const entry of timelineYearMatches) {
    const key = `${entry.chunk.docId}:${entry.chunk.sectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(entry);
  }
  for (const entry of experienceRanked) {
    const key = `${entry.chunk.docId}:${entry.chunk.sectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(entry);
  }
  return ordered;
}

function buildCitations(input: {
  ranked: RankedChunk[];
  intent: QueryIntent;
  query: string;
}): AskCitation[] {
  const citationRanked = pickProfileRankedContext({
    ranked: input.ranked,
    intent: input.intent,
    query: input.query,
  });

  return citationRanked.slice(0, 6).map(({ chunk }) => ({
    doc_id: chunk.docId,
    title: chunk.title,
    section_id: chunk.sectionId,
    snippet: makeSnippet(chunk.text),
  }));
}

function buildSuggestedLinks(input: {
  ranked: RankedChunk[];
  intent: QueryIntent;
  lang: Language;
  query: string;
}): AskSuggestedLink[] {
  const ranked = pickProfileRankedContext({
    ranked: input.ranked,
    intent: input.intent,
    query: input.query,
  });

  const links = Array.from(
    new Map(
      ranked
        .map((r) => r.chunk)
        .filter((c) => Boolean(c.href))
        .map((c) => [
          c.href!,
          { label: c.title, href: c.href! } satisfies AskSuggestedLink,
        ]),
    ).values(),
  );

  if (input.intent?.profile) {
    links.sort((a, b) => {
      const ah = a.href === `/${input.lang}/experience` ? -1 : 0;
      const bh = b.href === `/${input.lang}/experience` ? -1 : 0;
      return ah - bh;
    });
  }

  return links.slice(0, 4);
}

function uniqueValues(values: readonly string[], max: number): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (out.includes(value)) continue;
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

function chunkLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSkillsAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const skillNames = uniqueValues(
    input.ranked
      .filter((r) => r.chunk.docId.startsWith("skills:"))
      .map((r) => chunkLines(r.chunk.text)[0] ?? "")
      .filter((v) => v.length > 1),
    8,
  );

  const degreeSignals = uniqueValues(
    input.ranked
      .filter((r) => r.chunk.docId.startsWith("experience:"))
      .flatMap((r) => chunkLines(r.chunk.text))
      .filter((line) =>
        /(msc|bsc|ects|abschluss|graduated|certificate|zertifikat|wko)/i.test(line),
      ),
    4,
  );

  const linksHint =
    input.lang === "de"
      ? "Details findest du auf den Seiten **Skills**, **Experience** und **Projects**."
      : "You can find details on **Skills**, **Experience**, and **Projects**.";

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Deine Skills sind im Portfolio direkt über Studienabschlüsse, Zertifikate und aktuelle Projekterfahrung belegt.",
      "",
      "**Kernaussagen:**",
      ...skillNames.map((name) => `- ${name}`),
      ...degreeSignals.map((line) => `- ${line}`),
      "",
      `**Details:** ${linksHint}`,
    ].join("\n");
  }

  return [
    "**Short answer:** Your skills are directly evidenced on the site through degree records, certificates, and current project work.",
    "",
    "**Key points:**",
    ...skillNames.map((name) => `- ${name}`),
    ...degreeSignals.map((line) => `- ${line}`),
    "",
    `**Details:** ${linksHint}`,
  ].join("\n");
}

function buildThesisMethodAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const steps = uniqueValues(
    input.ranked
      .filter(
        (r) =>
          r.chunk.docId === "case_study:thesis" &&
          ["solution", "architecture", "summary"].includes(r.chunk.sectionId),
      )
      .flatMap((r) => chunkLines(r.chunk.text)),
    6,
  );

  const fallback = input.ranked
    .filter((r) => r.chunk.docId.includes("thesis"))
    .map((r) => makeSnippet(r.chunk.text))
    .slice(0, 4);

  const finalSteps = steps.length ? steps : fallback;

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Methodisch nutzt die Thesis ein strukturiertes ARIMA-GARCH-Setup mit Out-of-sample-Tests und VaR-Backtesting.",
      "",
      "**Kernaussagen:**",
      ...finalSteps.map((step) => `- ${step}`),
      "",
      "**Details:** Frag gerne nach Datenpipeline, Tuning-Logik oder Testdesign (DM-/Kupiec-/Christoffersen-Tests).",
    ].join("\n");
  }

  return [
    "**Short answer:** Method-wise, the thesis uses a structured ARIMA-GARCH pipeline with out-of-sample evaluation and VaR backtesting.",
    "",
    "**Key points:**",
    ...finalSteps.map((step) => `- ${step}`),
    "",
    "**Details:** Ask for the data pipeline, tuning logic, or test design (DM/Kupiec/Christoffersen).",
  ].join("\n");
}

function collectEvidenceLines(input: {
  ranked: RankedChunk[];
  max: number;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const entry of input.ranked) {
    const lines = chunkLines(entry.chunk.text);
    for (const line of lines) {
      const normalized = normalize(line);
      if (normalized.length < 8) continue;
      if (normalized.length > 200) continue;
      if (seen.has(normalized)) continue;
      if (/^(http|www\.|#)/i.test(line)) continue;
      seen.add(normalized);
      out.push(line);
      if (out.length >= input.max) return out;
    }
  }

  return out;
}

function buildContactAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const contactLines = collectEvidenceLines({
    ranked: input.ranked.filter((entry) => entry.chunk.docId === "page:contact"),
    max: 4,
  });

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Du kannst mich über das Kontaktformular auf der Website erreichen.",
      "",
      "**Kernaussagen:**",
      ...contactLines.map((line) => `- ${line}`),
      "- Wenn das Formular technisch hakt, nutze die E-Mail im Impressum als Fallback.",
      "",
      "**Details:** Öffne **/de/contact** oder **/de/impressum**.",
    ].join("\n");
  }

  return [
    "**Short answer:** You can reach me via the website contact form.",
    "",
    "**Key points:**",
    ...contactLines.map((line) => `- ${line}`),
    "- If the form has technical issues, use the email listed on the imprint/legal page.",
    "",
    "**Details:** Open **/en/contact** or **/en/imprint**.",
  ].join("\n");
}

function buildLegalAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const legalLines = collectEvidenceLines({
    ranked: input.ranked.filter((entry) => entry.chunk.docId.startsWith("page:/")),
    max: 5,
  });

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Die rechtlichen Informationen sind als Impressum + Datenschutzerklärung auf der Website verfügbar.",
      "",
      "**Kernaussagen:**",
      ...legalLines.map((line) => `- ${line}`),
      "",
      "**Details:** Für Rechts-/Datenschutzfragen direkt **/de/impressum** und **/de/datenschutz** prüfen.",
    ].join("\n");
  }

  return [
    "**Short answer:** Legal information is available on-site via imprint and privacy pages.",
    "",
    "**Key points:**",
    ...legalLines.map((line) => `- ${line}`),
    "",
    "**Details:** For legal/privacy details check **/en/imprint** and **/en/privacy**.",
  ].join("\n");
}

function buildRagWebsiteAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const core = collectEvidenceLines({
    ranked: input.ranked.filter((entry) =>
      ["landing:ask", "landing:focus", WEBSITE_CASE_DOC_ID].includes(entry.chunk.docId),
    ),
    max: 5,
  });

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Das Ask-System ist als citation-first RAG aufgebaut und antwortet aus den Website-Inhalten.",
      "",
      "**Kernaussagen:**",
      ...core.map((line) => `- ${line}`),
      "- Frage konkret nach Thesis, Skills, Zertifikaten oder Projekten für präzisere Treffer.",
      "",
      "**Details:** Wenn ein Thema fehlt, muss es zuerst als Content in die Website aufgenommen werden.",
    ].join("\n");
  }

  return [
    "**Short answer:** The Ask system is built as citation-first RAG and answers from website content.",
    "",
    "**Key points:**",
    ...core.map((line) => `- ${line}`),
    "- Ask specifically about thesis, skills, certificates, or projects for higher precision.",
    "",
    "**Details:** If a topic is missing, add it to site content first so retrieval can ground on it.",
  ].join("\n");
}

function buildProfileAnswer(input: {
  lang: Language;
  query: string;
  ranked: RankedChunk[];
}): string {
  const yearTokens = extractYearTokens(normalize(input.query));
  const experienceEntries = input.ranked.filter((entry) =>
    entry.chunk.docId.startsWith("experience:"),
  );

  const timelineEntries = experienceEntries.filter(
    (entry) => entry.chunk.sectionId === "timeline",
  );
  const matchingTimelineEntries =
    yearTokens.length > 0
      ? timelineEntries.filter((entry) =>
          yearTokens.some((year) => entry.chunk.text.includes(year)),
        )
      : timelineEntries;
  const timelineSummaries = uniqueValues(
    matchingTimelineEntries.map((entry) => {
      const lines = chunkLines(entry.chunk.text);
      const roleLine = lines.find((line) => /^(rolle|role):/i.test(line)) ?? "";
      const orgLine =
        lines.find((line) => /^(organisation|organization):/i.test(line)) ?? "";
      const periodLine = lines.find((line) => /^(zeitraum|period):/i.test(line)) ?? "";
      return [roleLine, orgLine, periodLine].filter(Boolean).join(" · ");
    }),
    4,
  );
  const timelineLines = collectEvidenceLines({
    ranked: timelineEntries,
    max: 8,
  });
  const outcomeLines = collectEvidenceLines({
    ranked: experienceEntries.filter((entry) => entry.chunk.sectionId === "outcomes"),
    max: 6,
  });

  const filteredTimelineLines =
    yearTokens.length > 0
      ? timelineLines.filter((line) => yearTokens.some((year) => line.includes(year)))
      : timelineLines;

  const bullets = timelineSummaries.length > 0
    ? timelineSummaries
    : filteredTimelineLines.length > 0
      ? filteredTimelineLines
      : [...timelineLines, ...outcomeLines].slice(0, 6);

  if (input.lang === "de") {
    return [
      "**Kurzantwort:** Das Portfolio enthält deinen Werdegang mit Rolle, Zeitraum und Outcomes.",
      "",
      yearTokens.length
        ? `**Kernaussagen für ${yearTokens.join(", ")}:**`
        : "**Kernaussagen:**",
      ...bullets.map((line) => `- ${line}`),
      "",
      "**Details:** Für den vollständigen Verlauf öffne **/de/experience**.",
    ].join("\n");
  }

  return [
    "**Short answer:** The portfolio includes your career timeline with role, period, and outcomes.",
    "",
    yearTokens.length
      ? `**Key points for ${yearTokens.join(", ")}:**`
      : "**Key points:**",
    ...bullets.map((line) => `- ${line}`),
    "",
    "**Details:** Open **/en/experience** for the full timeline.",
  ].join("\n");
}

function buildGenericAnswer(input: {
  lang: Language;
  ranked: RankedChunk[];
}): string {
  const top = input.ranked.slice(0, 4);
  const evidence = collectEvidenceLines({
    ranked: top,
    max: 6,
  });
  const fallbackBullets = top.map(
    ({ chunk }) =>
      `- **${chunk.title} · ${sectionLabel(chunk.sectionId, input.lang)}**: ${makeSnippet(chunk.text)}`,
  );
  const bullets =
    evidence.length > 0 ? evidence.map((line) => `- ${line}`) : fallbackBullets;

  if (input.lang === "de") {
    return [
      `**Kurzantwort:** Ich habe ${top.length} relevante Stellen im Portfolio gefunden.`,
      "",
      "**Kernaussagen:**",
      ...bullets,
      "",
      "**Details:** Frag gerne nach Methode, Tooling, Zeitraum oder Outcome für eine präzisere Antwort.",
    ].join("\n");
  }

  return [
    `**Short answer:** I found ${top.length} relevant sections in the portfolio.`,
    "",
    "**Key points:**",
    ...bullets,
    "",
    "**Details:** Ask for method, tooling, timeframe, or outcome to narrow it down further.",
  ].join("\n");
}

function buildLocalAnswer(input: {
  lang: Language;
  query: string;
  intent: QueryIntent;
  ranked: RankedChunk[];
}): string {
  if (input.intent.skills) {
    return buildSkillsAnswer({ lang: input.lang, ranked: input.ranked });
  }

  if (input.intent.thesis && input.intent.stepByStep) {
    return buildThesisMethodAnswer({ lang: input.lang, ranked: input.ranked });
  }

  if (input.intent.contact) {
    return buildContactAnswer({ lang: input.lang, ranked: input.ranked });
  }

  if (input.intent.legal) {
    return buildLegalAnswer({ lang: input.lang, ranked: input.ranked });
  }

  if (input.intent.profile) {
    return buildProfileAnswer({
      lang: input.lang,
      query: input.query,
      ranked: input.ranked,
    });
  }

  if (input.intent.rag || input.intent.website) {
    return buildRagWebsiteAnswer({ lang: input.lang, ranked: input.ranked });
  }

  return buildGenericAnswer({
    lang: input.lang,
    ranked: input.ranked,
  });
}

export function noEvidenceResult(lang: Language): AskResponse {
  return {
    answer:
      lang === "de"
        ? "Dazu finde ich in meinen Quellen aktuell **keine belastbare Information**. Ich antworte lieber nicht spekulativ.\n\nFrag mich stattdessen z. B. zu Werdegang, Masterarbeit, Zertifikaten, Skills oder Projekten."
        : "I currently have **no reliable evidence** for that in my sources. I prefer not to guess.\n\nAsk me instead about career timeline, thesis, certificates, skills, or projects.",
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
  const rankResult = rankCorpus({ query, corpus });
  let ranked = rankResult.ranked;

  if (ranked.length < 5) {
    const fallbackLang: Language = input.lang === "de" ? "en" : "de";
    const secondary = rankCorpus({
      query,
      corpus: await buildCorpus(fallbackLang),
    }).ranked.map((entry) => ({
      ...entry,
      score: entry.score * 0.9,
    }));
    ranked = [...ranked, ...secondary]
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  if (ranked.length === 0) {
    return noEvidenceResult(input.lang);
  }

  const queryTokens = toTokens(query);
  if (
    !hasSufficientEvidence({
      query,
      queryTokens,
      intent: rankResult.intent,
      ranked,
    })
  ) {
    return noEvidenceResult(input.lang);
  }

  const filteredRanked = pickProfileRankedContext({
    ranked,
    intent: rankResult.intent,
    query,
  });

  return {
    answer: buildLocalAnswer({
      lang: input.lang,
      query,
      intent: rankResult.intent,
      ranked: filteredRanked,
    }),
    citations: buildCitations({
      ranked: filteredRanked,
      intent: rankResult.intent,
      query,
    }),
    suggested_links: buildSuggestedLinks({
      ranked: filteredRanked,
      intent: rankResult.intent,
      lang: input.lang,
      query,
    }),
  };
}

export async function answerFromCorpusWithLlm(input: {
  query: string;
  lang: Language;
}): Promise<AskResponse> {
  const query = input.query.trim();
  const corpus = await buildCorpus(input.lang);
  const { ranked, intent } = rankCorpus({ query, corpus });

  if (ranked.length === 0) {
    return noEvidenceResult(input.lang);
  }

  const queryTokens = toTokens(query);
  if (
    !hasSufficientEvidence({
      query,
      queryTokens,
      intent,
      ranked,
    })
  ) {
    return noEvidenceResult(input.lang);
  }

  const filteredRanked = pickProfileRankedContext({
    ranked,
    intent,
    query,
  });

  const citations = buildCitations({
    ranked: filteredRanked,
    intent,
    query,
  });
  const suggested_links = buildSuggestedLinks({
    ranked: filteredRanked,
    intent,
    lang: input.lang,
    query,
  });
  const sources = sourcesFromRanked(filteredRanked);
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
      answer: buildLocalAnswer({
        lang: input.lang,
        query,
        intent,
        ranked: filteredRanked,
      }),
      citations,
      suggested_links,
    };
  }
}
