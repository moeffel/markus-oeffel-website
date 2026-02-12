import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";

import {
  getCaseStudies,
  getExperience,
  getThesis,
} from "@/lib/content";
import { openAiEmbedding } from "@/lib/ai/openai";
import { ragGetExistingHashes, ragUpsertChunk, type RagVisibility } from "@/lib/rag/db";
import { getPrivateProfileContent } from "@/lib/rag/private-profile";
import { getSiteUrl } from "@/lib/seo";
import type { CaseStudy, ExperienceItem, Thesis } from "@/lib/content/schemas";

type RagChunkInput = {
  id: string;
  docId: string;
  title: string;
  href: string | null;
  sectionId: string;
  lang: "de" | "en";
  visibility: RagVisibility;
  content: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function makeId(input: Omit<RagChunkInput, "id">): string {
  return `${input.docId}:${input.sectionId}:${input.lang}:${input.visibility}`;
}

function clampText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1))}…`;
}

function splitIntoReasonableChunks(text: string, maxChars = 1200): string[] {
  const blocks = text
    .split(/\n{2,}/g)
    .map((b) => b.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buf = "";
  for (const b of blocks) {
    if (!buf) {
      buf = b;
      continue;
    }
    if (buf.length + 2 + b.length <= maxChars) {
      buf = `${buf}\n\n${b}`;
      continue;
    }
    out.push(buf);
    buf = b;
  }
  if (buf) out.push(buf);

  return out;
}

function caseStudyChunks(cs: CaseStudy, lang: "de" | "en"): RagChunkInput[] {
  const docId = `case_study:${cs.slug}`;
  const title = cs.title[lang];
  const href =
    cs.slug === "thesis" ? `/${lang}/thesis` : `/${lang}/projects/${cs.slug}`;

  const base = {
    docId,
    title,
    href,
    lang,
    visibility: "public" as const,
  };

  const chunks: Array<Omit<RagChunkInput, "id">> = [
    { ...base, sectionId: "summary", content: cs.summary[lang] },
    { ...base, sectionId: "context", content: cs.context[lang] },
    { ...base, sectionId: "problem", content: cs.problem[lang] },
    { ...base, sectionId: "solution", content: cs.solution[lang].join("\n") },
    { ...base, sectionId: "constraints", content: cs.constraints[lang].join("\n") },
    { ...base, sectionId: "role", content: cs.yourRole[lang].join("\n") },
    {
      ...base,
      sectionId: "impact",
      content: cs.impact[lang].map((i) => i.text).join("\n"),
    },
  ];

  if (cs.architecture?.type === "text" || cs.architecture?.type === "mermaid") {
    chunks.push({
      ...base,
      sectionId: "architecture",
      content: cs.architecture.payload[lang],
    });
  }

  if (cs.learnings) {
    chunks.push({
      ...base,
      sectionId: "learnings",
      content: cs.learnings[lang].join("\n"),
    });
  }

  return chunks
    .map((c) => ({ ...c, content: c.content.trim() }))
    .filter((c) => Boolean(c.content))
    .map((c) => ({ ...c, id: makeId(c) }));
}

function experienceChunks(items: readonly ExperienceItem[], lang: "de" | "en"): RagChunkInput[] {
  const chunks: RagChunkInput[] = [];
  for (const [idx, item] of items.entries()) {
    const docId = `experience:${idx}`;
    const title = `${item.role[lang]}${item.org ? ` @ ${item.org}` : ""}`;
    const href = `/${lang}/experience`;
    const content = item.outcomes[lang].join("\n");
    const c: Omit<RagChunkInput, "id"> = {
      docId,
      title,
      href,
      sectionId: "outcomes",
      lang,
      visibility: "public",
      content,
    };
    chunks.push({ ...c, id: makeId(c) });
  }
  return chunks;
}

function thesisChunks(thesis: Thesis, lang: "de" | "en"): RagChunkInput[] {
  const base: Omit<RagChunkInput, "id" | "sectionId" | "content"> = {
    docId: "thesis",
    title: thesis.title[lang],
    href: `/${lang}/thesis`,
    lang,
    visibility: "public",
  };

  const summary: Omit<RagChunkInput, "id"> = {
    ...base,
    sectionId: "summary",
    content: thesis.summary[lang],
  };
  return [{ ...summary, id: makeId(summary) }];
}

async function fetchUrlText(url: string): Promise<string | null> {
  const res = await fetch(url).catch(() => null);
  if (!res || !res.ok) return null;
  return await res.text().catch(() => null);
}

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function publicFilePathFromUrlPath(urlPath: string): string | null {
  if (!urlPath.startsWith("/")) return null;
  const root = path.resolve(process.cwd(), "public");
  const resolved = path.resolve(root, urlPath.slice(1));
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

function toAbsoluteUrl(maybeUrlOrPath: string): string | null {
  if (isHttpUrl(maybeUrlOrPath)) return maybeUrlOrPath;
  if (maybeUrlOrPath.startsWith("/")) return `${getSiteUrl()}${maybeUrlOrPath}`;
  return null;
}

async function readOptionalFileBuffer(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function readOptionalFileText(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function fetchPdfText(urlOrPath: string): Promise<string | null> {
  const absoluteUrl = toAbsoluteUrl(urlOrPath);
  if (absoluteUrl) {
    const res = await fetch(absoluteUrl).catch(() => null);
    if (!res || !res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText().catch(() => null);
    await parser.destroy().catch(() => null);
    const text = result?.text?.trim();
    return text ? text : null;
  }

  const localPath =
    publicFilePathFromUrlPath(urlOrPath) ?? path.resolve(process.cwd(), urlOrPath);
  const buf = await readOptionalFileBuffer(localPath);
  if (!buf) return null;
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText().catch(() => null);
  await parser.destroy().catch(() => null);
  const text = result?.text?.trim();
  return text ? text : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readTextAsset(urlOrPath: string): Promise<string | null> {
  const absoluteUrl = toAbsoluteUrl(urlOrPath);
  if (absoluteUrl) return await fetchUrlText(absoluteUrl).catch(() => null);

  const localPath =
    publicFilePathFromUrlPath(urlOrPath) ?? path.resolve(process.cwd(), urlOrPath);
  return await readOptionalFileText(localPath).catch(() => null);
}

async function thesisAssetChunks(thesis: Thesis, lang: "de" | "en"): Promise<RagChunkInput[]> {
  const out: RagChunkInput[] = [];

  if (thesis.pdfPath) {
    const text = await fetchPdfText(thesis.pdfPath).catch(() => null);
    if (text) {
      for (const [i, block] of splitIntoReasonableChunks(text, 1400).entries()) {
        const c: Omit<RagChunkInput, "id"> = {
          docId: "thesis:pdf",
          title: thesis.title[lang],
          href: `/${lang}/thesis`,
          sectionId: `pdf:${i}`,
          lang,
          visibility: "public",
          content: block,
        };
        out.push({ ...c, id: makeId(c) });
      }
    }
  }

  if (thesis.notebookPath) {
    const html = await readTextAsset(thesis.notebookPath).catch(() => null);
    if (html) {
      const text = stripHtml(html);
      for (const [i, block] of splitIntoReasonableChunks(text, 1400).entries()) {
        const c: Omit<RagChunkInput, "id"> = {
          docId: "thesis:notebook",
          title: thesis.title[lang],
          href: `/${lang}/thesis`,
          sectionId: `notebook:${i}`,
          lang,
          visibility: "public",
          content: block,
        };
        out.push({ ...c, id: makeId(c) });
      }
    }
  }

  return out;
}

async function privateProfileChunks(lang: "de" | "en"): Promise<RagChunkInput[]> {
  const content = await getPrivateProfileContent();
  if (!content) return [];
  const raw = content[lang]?.trim();
  if (!raw) return [];

  const blocks = splitIntoReasonableChunks(raw, 1400);
  return blocks.map((block, idx) => {
    const c: Omit<RagChunkInput, "id"> = {
      docId: "private_profile",
      title: lang === "de" ? "Private Profile" : "Private profile",
      href: null,
      sectionId: `chunk:${idx}`,
      lang,
      visibility: "private",
      content: block,
    };
    return { ...c, id: makeId(c) };
  });
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const current = idx;
      idx += 1;
      results[current] = await fn(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function ingestRagCorpus(): Promise<{
  ok: true;
  total: number;
  skipped: number;
  upserted: number;
}> {
  const [caseStudies, thesis, experience] = await Promise.all([
    getCaseStudies({ publishedOnly: true }),
    getThesis(),
    getExperience(),
  ]);

  const langs: Array<"de" | "en"> = ["de", "en"];

  const allChunks: RagChunkInput[] = [];
  for (const lang of langs) {
    for (const cs of caseStudies) allChunks.push(...caseStudyChunks(cs, lang));
    allChunks.push(...thesisChunks(thesis, lang));
    allChunks.push(...experienceChunks(experience, lang));
    allChunks.push(...(await thesisAssetChunks(thesis, lang)));
    allChunks.push(...(await privateProfileChunks(lang)));
  }

  const existing = await ragGetExistingHashes();

  const toUpsert = allChunks
    .map((c) => ({ ...c, content: c.content.trim() }))
    .filter((c) => Boolean(c.content))
    .map((c) => ({ chunk: c, hash: sha256(c.content) }))
    .filter(({ chunk, hash }) => existing.get(chunk.id) !== hash);

  const skipped = allChunks.length - toUpsert.length;

  await mapWithConcurrency(toUpsert, 2, async ({ chunk, hash }) => {
    const embedding = await openAiEmbedding({ text: clampText(chunk.content, 6000) });
    await ragUpsertChunk({
      id: chunk.id,
      docId: chunk.docId,
      title: chunk.title,
      href: chunk.href,
      sectionId: chunk.sectionId,
      lang: chunk.lang,
      visibility: chunk.visibility,
      content: chunk.content,
      contentHash: hash,
      embedding,
    });
  });

  return {
    ok: true,
    total: allChunks.length,
    skipped,
    upserted: toUpsert.length,
  };
}
