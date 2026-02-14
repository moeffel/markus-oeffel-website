import { openAiEmbedding } from "@/lib/ai/openai";
import type { AskCitation, AskSuggestedLink } from "@/lib/ask/answer";
import {
  ragKeywordSearch,
  ragVectorSearch,
  type RagChunkRow,
  type RagVisibility,
} from "@/lib/rag/db";

function redactPrivate(text: string): string {
  return text
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[redacted-email]",
    )
    .replace(
      /(\+?\d[\d\s().-]{7,}\d)/g,
      "[redacted-phone]",
    );
}

function makeSnippet(text: string, visibility: RagVisibility): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const safe = visibility === "private" ? redactPrivate(clean) : clean;
  const max = visibility === "private" ? 140 : 180;
  if (safe.length <= max) return safe;
  return `${safe.slice(0, Math.max(0, max - 1))}…`;
}

function clamp(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1))}…`;
}

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
  "auf",
  "für",
  "wie",
  "dein",
  "deine",
  "deinen",
  "du",
  "ich",
  "about",
  "your",
]);

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

function lexicalHitRate(queryTokens: readonly string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const chunkTokens = toTokens(text);
  if (chunkTokens.length === 0) return 0;
  const chunkSet = new Set(chunkTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (chunkSet.has(token) || hasPrefixMatch(token, chunkTokens)) hits += 1;
  }
  return hits / queryTokens.length;
}

function lexicalCoverage(queryTokens: readonly string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const normalized = normalize(text);
  let covered = 0;
  for (const token of queryTokens) {
    if (normalized.includes(token)) covered += 1;
  }
  return covered / queryTokens.length;
}

function extractYearTokens(text: string): string[] {
  return Array.from(new Set(text.match(/\b(?:19|20)\d{2}\b/g) ?? []));
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
      "certification",
      "msc",
      "bsc",
      "degree",
      "abschluss",
      "prüfung",
      "wko",
    ]) ||
    hasPhrase([
      "commercial asset advisor",
      "vermögensberater",
      "google advanced data analytics",
    ]);

  const thesis =
    hasToken([
      "thesis",
      "masterarbeit",
      "arima",
      "garch",
      "var",
      "backtest",
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
      "deploy",
      "deployment",
      "vercel",
      "playwright",
      "ask",
      "assistant",
      "rag",
      "citations",
      "citation",
    ]) ||
    hasPhrase(["ask me anything", "markus oeffel s website", "markus öffel s website"]);

  const rag =
    hasToken([
      "rag",
      "retrieval",
      "embedding",
      "vector",
      "prompt",
      "assistant",
      "ask",
      "source",
      "sources",
      "citations",
      "citation",
    ]) ||
    hasPhrase(["retrieval augmented generation", "mit citations", "with citations"]);

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
  if (docId.startsWith("thesis")) return "thesis";
  if (docId === "case_study:thesis") return "thesis";
  if (docId.startsWith("case_study:")) return "case_study";
  if (docId.startsWith("experience:")) return "experience";
  if (docId.startsWith("landing:") || docId === "page:home") return "landing";
  if (docId.startsWith("how_i_work:")) return "principles";
  if (docId === "page:contact") return "contact";
  if (docId.startsWith("page:/")) return "legal";
  return "other";
}

function intentBoost(input: {
  intent: QueryIntent;
  chunk: RagChunkRow;
}): number {
  const { intent, chunk } = input;
  const docGroup = classifyDocGroup(chunk.doc_id);
  const sectionId = chunk.section_id;
  const searchableText = normalize(`${chunk.title}\n${sectionId}\n${chunk.content}`);

  let boost = 0;

  if (intent.skills) {
    if (docGroup === "skills") boost += 0.24;
    if (docGroup === "experience") boost += 0.1;
  }

  if (intent.thesis) {
    if (docGroup === "thesis") boost += 0.25;
    if (["solution", "architecture", "summary", "impact"].some((s) => sectionId.includes(s))) {
      boost += 0.12;
    }
  }

  if (intent.stepByStep && (sectionId.includes("solution") || sectionId.includes("architecture"))) {
    boost += 0.11;
  }

  if (intent.profile && docGroup === "experience") {
    boost += 0.12;
    if (sectionId.includes("timeline") || sectionId.includes("period")) {
      boost += 0.1;
    }
  }

  if (intent.profile && intent.years.length > 0) {
    const hasYear = intent.years.some((year) => searchableText.includes(year));
    if (docGroup === "experience") {
      boost += hasYear ? 0.32 : -0.08;
    } else if (hasYear) {
      boost -= 0.08;
    } else {
      boost -= 0.14;
    }
  }

  if (intent.contact && docGroup === "contact") {
    boost += 0.24;
  }

  if (intent.legal && docGroup === "legal") {
    boost += 0.2;
  }

  if (intent.rag || intent.website) {
    if (chunk.doc_id === "landing:ask" || chunk.doc_id === "page:home") boost += 0.18;
    if (chunk.doc_id === "case_study:markus-oeffel-website") boost += 0.14;
  }

  if (!intent.website && chunk.doc_id === "case_study:markus-oeffel-website") {
    boost -= 0.18;
  }

  if (!intent.contact && docGroup === "contact") {
    boost -= 0.08;
  }

  if (!intent.legal && docGroup === "legal") {
    boost -= 0.08;
  }

  return boost;
}

function cosineSimilarityFromDistance(distance: number): number {
  // pgvector cosine distance is 1 - cosine_similarity
  // similarity in [-1, 1]
  if (!Number.isFinite(distance)) return -1;
  return 1 - distance;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

type ScoredCandidate = {
  chunk: RagChunkRow;
  cosineSimilarity: number;
  lexical: number;
  coverage: number;
  score: number;
};

function selectDiverse(
  sorted: ScoredCandidate[],
  input: { k: number; maxPerDoc: number; intent: QueryIntent },
): RagChunkRow[] {
  const byDoc = new Map<string, number>();
  const byGroup = new Map<string, number>();
  const out: RagChunkRow[] = [];
  const maxPerGroup = input.intent.website || input.intent.rag ? 5 : input.intent.profile ? 6 : 4;

  for (const item of sorted) {
    const docId = item.chunk.doc_id;
    const group = classifyDocGroup(docId);
    const count = byDoc.get(docId) ?? 0;
    const groupCount = byGroup.get(group) ?? 0;
    if (count >= input.maxPerDoc) continue;
    if (groupCount >= maxPerGroup) continue;
    out.push(item.chunk);
    byDoc.set(docId, count + 1);
    byGroup.set(group, groupCount + 1);
    if (out.length >= input.k) break;
  }

  return out;
}

function hasSufficientVectorEvidence(input: {
  query: string;
  queryTokens: readonly string[];
  intent: QueryIntent;
  selected: readonly ScoredCandidate[];
}): boolean {
  if (input.selected.length === 0) return false;

  const nonLanding = input.selected.filter((item) => {
    const group = classifyDocGroup(item.chunk.doc_id);
    return group !== "landing" && group !== "other";
  });
  if (nonLanding.length === 0) return false;

  const maxLexical = Math.max(0, ...nonLanding.map((item) => item.lexical));
  const maxCoverage = Math.max(0, ...nonLanding.map((item) => item.coverage));
  const hasStrongHit = nonLanding.some(
    (item) =>
      item.lexical >= 0.66 ||
      item.coverage >= 0.66 ||
      (item.lexical >= 0.5 && item.coverage >= 0.34),
  );

  if (input.queryTokens.length === 1 && maxLexical < 1 && maxCoverage < 1) {
    return false;
  }

  if (
    input.queryTokens.length >= 2 &&
    maxLexical < 0.66 &&
    maxCoverage < 0.66 &&
    !hasStrongHit
  ) {
    return false;
  }

  if (input.queryTokens.length >= 4 && !hasStrongHit) {
    return false;
  }

  if (input.intent.sensitivePersonal) {
    const hasSensitiveEvidence = nonLanding.some((item) =>
      /(age|alt|born|birth|geburt|geburtsdatum|birthday|wohnort|address|adresse|telefon|phone)/i.test(
        `${item.chunk.title}\n${item.chunk.section_id}\n${item.chunk.content}`,
      ),
    );
    if (!hasSensitiveEvidence) return false;
  }

  if (input.intent.profile && input.intent.years.length > 0) {
    const hasExperienceYearEvidence = nonLanding.some((item) => {
      if (!item.chunk.doc_id.startsWith("experience:")) return false;
      return input.intent.years.some((year) =>
        `${item.chunk.title}\n${item.chunk.section_id}\n${item.chunk.content}`.includes(year),
      );
    });
    if (!hasExperienceYearEvidence) return false;
  }

  if (input.intent.skills) {
    const hasSkillEvidence = nonLanding.some(
      (item) =>
        item.chunk.doc_id.startsWith("skills:") &&
        (item.lexical >= 0.34 || item.coverage >= 0.34),
    );
    if (!hasSkillEvidence) return false;
  }

  if (input.intent.thesis) {
    const hasThesisEvidence = nonLanding.some(
      (item) =>
        ["thesis", "case_study"].includes(classifyDocGroup(item.chunk.doc_id)) &&
        (item.lexical >= 0.34 || item.coverage >= 0.34),
    );
    if (!hasThesisEvidence) return false;
  }

  const normalized = normalize(input.query);
  const asksAge = /\b(wie alt|how old|date of birth|geburtsdatum|birthday|birth)\b/.test(
    normalized,
  );
  if (asksAge) {
    const hasAgeEvidence = nonLanding.some((item) =>
      /(age|alt|born|birth|geburt|geburtsdatum|birthday)/i.test(
        `${item.chunk.title}\n${item.chunk.content}`,
      ),
    );
    if (!hasAgeEvidence) return false;
  }

  return true;
}

function pickProfileChunks(input: {
  chunks: RagChunkRow[];
  intent: QueryIntent;
}): RagChunkRow[] {
  if (!input.intent.profile) return input.chunks;

  const experienceChunks = input.chunks.filter((chunk) =>
    chunk.doc_id.startsWith("experience:"),
  );
  if (experienceChunks.length === 0) return input.chunks;

  const years = input.intent.years;
  if (years.length === 0) return experienceChunks;

  const yearMatches = experienceChunks.filter((chunk) => {
    const text = `${chunk.title}\n${chunk.section_id}\n${chunk.content}`;
    return years.some((year) => text.includes(year));
  });
  if (yearMatches.length === 0) return experienceChunks;

  const ordered: RagChunkRow[] = [];
  const seen = new Set<string>();
  for (const chunk of yearMatches) {
    const key = `${chunk.doc_id}:${chunk.section_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(chunk);
  }
  for (const chunk of experienceChunks) {
    const key = `${chunk.doc_id}:${chunk.section_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(chunk);
  }
  return ordered;
}

export async function retrieveRagContext(input: {
  query: string;
  lang: "de" | "en";
  visibilities?: RagVisibility[];
}): Promise<{
  chunks: RagChunkRow[];
  citations: AskCitation[];
  suggested_links: AskSuggestedLink[];
  sources: string;
}> {
  const finalK = Math.min(12, Math.max(3, Number(process.env.ASK_TOP_K ?? 8)));
  const candidatesK = Math.max(
    finalK,
    Math.min(60, Math.max(12, Number(process.env.ASK_CANDIDATES ?? 24))),
  );
  const maxPerDoc = Math.min(
    6,
    Math.max(1, Number(process.env.ASK_MAX_PER_DOC ?? 3)),
  );

  const minCosineSimilarity =
    parseOptionalNumber(process.env.ASK_MIN_COSINE_SIMILARITY) ?? null;

  const embedding = await openAiEmbedding({ text: input.query });
  const vectorCandidates = await ragVectorSearch({
    embedding,
    lang: input.lang,
    topK: candidatesK,
    visibilities: input.visibilities ?? ["public", "private"],
  });

  const queryTokens = toTokens(input.query);
  const keywordTokens = queryTokens
    .filter((token) => token.length >= 3 || /\b(?:19|20)\d{2}\b/.test(token))
    .slice(0, 8);
  const lexicalCandidates =
    keywordTokens.length > 0
      ? await ragKeywordSearch({
          lang: input.lang,
          topK: Math.min(candidatesK, 20),
          visibilities: input.visibilities ?? ["public", "private"],
          tokens: keywordTokens,
        }).catch(() => [])
      : [];

  const merged = new Map<string, RagChunkRow>();
  for (const candidate of [...vectorCandidates, ...lexicalCandidates]) {
    const existing = merged.get(candidate.id);
    if (!existing || candidate.distance < existing.distance) {
      merged.set(candidate.id, candidate);
    }
  }
  const candidates = Array.from(merged.values());

  const intent = parseQueryIntent({
    query: input.query,
    queryTokens,
  });

  const scored: ScoredCandidate[] = candidates
    .map((chunk) => {
      const cosineSimilarity = cosineSimilarityFromDistance(chunk.distance);
      const textForLexical = `${chunk.title}\n${chunk.section_id}\n${chunk.content}`;
      const lexical = lexicalHitRate(queryTokens, textForLexical);
      const coverage = lexicalCoverage(queryTokens, textForLexical);
      const prior = intentBoost({ intent, chunk });

      const score =
        cosineSimilarity * 0.62 +
        lexical * 0.22 +
        coverage * 0.11 +
        prior +
        (chunk.href ? 0.02 : 0);

      return { chunk, cosineSimilarity, lexical, coverage, score };
    })
    .filter((s) => {
      if (minCosineSimilarity == null) return true;
      // Allow lexical hits to override similarity threshold for exact terms.
      return (
        s.cosineSimilarity >= minCosineSimilarity ||
        s.lexical >= 0.2 ||
        s.coverage >= 0.35
      );
    })
    .sort((a, b) => b.score - a.score || b.lexical - a.lexical || b.cosineSimilarity - a.cosineSimilarity);

  const selectedRaw = selectDiverse(scored, { k: finalK, maxPerDoc, intent });
  const selected = pickProfileChunks({
    chunks: selectedRaw,
    intent,
  });

  const scoredById = new Map(scored.map((item) => [item.chunk.id, item]));
  const selectedScored = selected
    .map((chunk) => scoredById.get(chunk.id))
    .filter((item): item is ScoredCandidate => Boolean(item));

  if (
    !hasSufficientVectorEvidence({
      query: input.query,
      queryTokens,
      intent,
      selected: selectedScored,
    })
  ) {
    return { chunks: [], citations: [], suggested_links: [], sources: "" };
  }

  const sources = selected
    .map((c, idx) => {
      const cosineSimilarity = cosineSimilarityFromDistance(c.distance);
      return [
        `SOURCE ${idx + 1}`,
        `doc_id: ${c.doc_id}`,
        `title: ${c.title}`,
        `section_id: ${c.section_id}`,
        `href: ${c.href ?? ""}`,
        `visibility: ${c.visibility}`,
        `cosine_similarity: ${cosineSimilarity.toFixed(4)}`,
        `text: ${clamp(c.content, 1200)}`,
      ].join("\n");
    })
    .join("\n\n");

  const citations: AskCitation[] = selected.slice(0, 8).map((c) => ({
    doc_id: c.doc_id,
    title: c.title,
    section_id: c.section_id,
    snippet: makeSnippet(c.content, c.visibility),
  }));

  const suggested_links: AskSuggestedLink[] = Array.from(
    new Map(
      selected
        .filter((c) => Boolean(c.href))
        .map((c) => [
          c.href!,
          { label: c.title, href: c.href! } satisfies AskSuggestedLink,
        ]),
    ).values(),
  ).slice(0, 4);

  return { chunks: selected, citations, suggested_links, sources };
}
