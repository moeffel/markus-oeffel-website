import { openAiEmbedding } from "@/lib/ai/openai";
import type { AskCitation, AskSuggestedLink } from "@/lib/ask/answer";
import { ragVectorSearch, type RagChunkRow, type RagVisibility } from "@/lib/rag/db";

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

function toTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function lexicalHitRate(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const chunkSet = new Set(toTokens(text));
  let hits = 0;
  for (const t of queryTokens) if (chunkSet.has(t)) hits += 1;
  return hits / queryTokens.length;
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

function selectDiverse(
  sorted: Array<{
    chunk: RagChunkRow;
    cosineSimilarity: number;
    lexical: number;
    score: number;
  }>,
  input: { k: number; maxPerDoc: number },
): RagChunkRow[] {
  const byDoc = new Map<string, number>();
  const out: RagChunkRow[] = [];

  for (const item of sorted) {
    const docId = item.chunk.doc_id;
    const count = byDoc.get(docId) ?? 0;
    if (count >= input.maxPerDoc) continue;
    out.push(item.chunk);
    byDoc.set(docId, count + 1);
    if (out.length >= input.k) break;
  }

  return out;
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
  const candidates = await ragVectorSearch({
    embedding,
    lang: input.lang,
    topK: candidatesK,
    visibilities: input.visibilities ?? ["public", "private"],
  });

  const queryTokens = toTokens(input.query);

  const scored = candidates
    .map((chunk) => {
      const cosineSimilarity = cosineSimilarityFromDistance(chunk.distance);
      const lexical = lexicalHitRate(queryTokens, chunk.content);

      // Best-practice-ish: combine semantic (cosine) and lexical overlap,
      // then apply mild priors for structure and linkability.
      const score =
        cosineSimilarity * 0.72 +
        lexical * 0.28 +
        (chunk.href ? 0.02 : 0);

      return { chunk, cosineSimilarity, lexical, score };
    })
    .filter((s) => {
      if (minCosineSimilarity == null) return true;
      // Allow lexical hits to override similarity threshold for exact terms.
      return s.cosineSimilarity >= minCosineSimilarity || s.lexical >= 0.2;
    })
    .sort((a, b) => b.score - a.score);

  const selected = selectDiverse(scored, { k: finalK, maxPerDoc });

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

