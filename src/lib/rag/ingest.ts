import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";

import {
  getCaseStudies,
  getExperience,
  getHowIWorkPrinciples,
  getSiteSettings,
  getSkillCategories,
  getThesis,
} from "@/lib/content";
import { openAiEmbedding } from "@/lib/ai/openai";
import { ragGetExistingHashes, ragPruneMissingIds, ragUpsertChunk, type RagVisibility } from "@/lib/rag/db";
import { getPrivateProfileContent } from "@/lib/rag/private-profile";
import { getSiteUrl } from "@/lib/seo";
import { CONTACT_COPY, LANDING_COPY, LEGAL_COPY } from "@/lib/content/site-copy";
import type { CaseStudy, ExperienceItem, HowIWorkPrinciple, SiteSettings, SkillCategory, Thesis } from "@/lib/content/schemas";

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

function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  // Heuristic sentence split good enough for DE/EN (no extra deps).
  return clean
    .split(/(?<=[.!?])\s+(?=[^\s])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitIntoReasonableChunks(
  text: string,
  maxChars = 1200,
  overlapSentences = 2,
): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const out: string[] = [];
  let buf: string[] = [];
  let bufLen = 0;

  for (const s of sentences) {
    const nextLen = bufLen + (buf.length ? 1 : 0) + s.length;
    if (buf.length > 0 && nextLen > maxChars) {
      out.push(buf.join(" "));
      const overlap = overlapSentences > 0 ? buf.slice(-overlapSentences) : [];
      buf = [...overlap, s];
      bufLen = buf.join(" ").length;
      continue;
    }

    buf.push(s);
    bufLen = nextLen;
  }

  if (buf.length) out.push(buf.join(" "));
  return out;
}

function chunkSection(input: {
  docId: string;
  title: string;
  href: string | null;
  sectionId: string;
  lang: "de" | "en";
  visibility: RagVisibility;
  content: string;
  maxChars?: number;
}): RagChunkInput[] {
  const blocks = splitIntoReasonableChunks(
    input.content,
    input.maxChars ?? 1200,
    2,
  );

  if (blocks.length === 0) return [];
  if (blocks.length === 1) {
    const c: Omit<RagChunkInput, "id"> = {
      docId: input.docId,
      title: input.title,
      href: input.href,
      sectionId: input.sectionId,
      lang: input.lang,
      visibility: input.visibility,
      content: blocks[0]!,
    };
    return [{ ...c, id: makeId(c) }];
  }

  return blocks.map((block, idx) => {
    const c: Omit<RagChunkInput, "id"> = {
      docId: input.docId,
      title: input.title,
      href: input.href,
      sectionId: `${input.sectionId}:${idx}`,
      lang: input.lang,
      visibility: input.visibility,
      content: block,
    };
    return { ...c, id: makeId(c) };
  });
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

  const chunks: RagChunkInput[] = [];
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "summary",
      content: cs.summary[lang],
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "context",
      content: cs.context[lang],
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "problem",
      content: cs.problem[lang],
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "solution",
      content: cs.solution[lang].join("\n"),
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "constraints",
      content: cs.constraints[lang].join("\n"),
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "role",
      content: cs.yourRole[lang].join("\n"),
    }),
  );
  chunks.push(
    ...chunkSection({
      ...base,
      sectionId: "impact",
      content: cs.impact[lang].map((i) => i.text).join("\n"),
    }),
  );

  if (cs.architecture?.type === "text" || cs.architecture?.type === "mermaid") {
    chunks.push(
      ...chunkSection({
        ...base,
        sectionId: "architecture",
        content: cs.architecture.payload[lang],
      }),
    );
  }

  if (cs.learnings) {
    chunks.push(
      ...chunkSection({
        ...base,
        sectionId: "learnings",
        content: cs.learnings[lang].join("\n"),
      }),
    );
  }

  return chunks
    .map((c) => ({ ...c, content: c.content.trim() }))
    .filter((c) => Boolean(c.content));
}

function experienceChunks(items: readonly ExperienceItem[], lang: "de" | "en"): RagChunkInput[] {
  const chunks: RagChunkInput[] = [];
  for (const [idx, item] of items.entries()) {
    const docId = `experience:${idx}`;
    const title = `${item.role[lang]}${item.org ? ` @ ${item.org}` : ""}`;
    const href = `/${lang}/experience`;
    const content = item.outcomes[lang].join("\n");
    chunks.push(
      ...chunkSection({
        docId,
        title,
        href,
        sectionId: "outcomes",
        lang,
        visibility: "public",
        content,
        maxChars: 1000,
      }),
    );
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

  return chunkSection({
    ...base,
    sectionId: "summary",
    content: thesis.summary[lang],
    maxChars: 1000,
  });
}

function siteSettingsChunks(settings: SiteSettings, lang: "de" | "en"): RagChunkInput[] {
  const docId = "site_settings";
  const title = lang === "de" ? "Website Settings" : "Website settings";
  const href = `/${lang}`;

  const blocks: Array<{ sectionId: string; content: string }> = [];

  if (settings.bookCallUrl) {
    blocks.push({ sectionId: "book_call_url", content: `bookCallUrl: ${settings.bookCallUrl}` });
  }
  if (settings.cvUrl) {
    blocks.push({ sectionId: "cv_url", content: `cvUrl: ${settings.cvUrl}` });
  }

  if (settings.socialLinks.length) {
    blocks.push({
      sectionId: "social_links",
      content: settings.socialLinks
        .map((l) => `${l.label}: ${l.url}`)
        .join("\n"),
    });
  }

  if (settings.heroKpis.length) {
    blocks.push({
      sectionId: "hero_kpis",
      content: settings.heroKpis
        .map((k) => `${k.label[lang]}: ${k.value}`)
        .join("\n"),
    });
  }

  return blocks.flatMap((b) =>
    chunkSection({
      docId,
      title,
      href,
      sectionId: b.sectionId,
      lang,
      visibility: "public",
      content: b.content,
      maxChars: 900,
    }),
  );
}

function skillsChunks(categories: readonly SkillCategory[], lang: "de" | "en"): RagChunkInput[] {
  const chunks: RagChunkInput[] = [];
  for (const category of categories) {
    const docId = `skills:${category.title.en.toLowerCase().replace(/\s+/g, "-")}`;
    const title = category.title[lang];
    const href = `/${lang}/skills`;
    const content = category.items
      .map((i) => (i.note ? `${i.name} — ${i.note[lang]}` : i.name))
      .join("\n");
    chunks.push(
      ...chunkSection({
        docId,
        title,
        href,
        sectionId: "items",
        lang,
        visibility: "public",
        content,
      }),
    );
  }
  return chunks;
}

function howIWorkChunks(principles: readonly HowIWorkPrinciple[], lang: "de" | "en"): RagChunkInput[] {
  const chunks: RagChunkInput[] = [];
  for (const p of principles) {
    const docId = `how_i_work:${p.title.en.toLowerCase().replace(/\s+/g, "-")}`;
    const title = p.title[lang];
    const href = `/${lang}/skills`;
    const content = p.body[lang];
    chunks.push(
      ...chunkSection({
        docId,
        title,
        href,
        sectionId: "principle",
        lang,
        visibility: "public",
        content,
        maxChars: 900,
      }),
    );
  }
  return chunks;
}

function legalSectionToText(section: {
  title: string;
  description?: string;
  paragraphs?: readonly string[];
  listItems?: readonly string[];
  infoItems?: readonly { label: string; value: string }[];
}): string {
  const parts: string[] = [];
  parts.push(section.title);
  if (section.description) parts.push(section.description);
  if (section.infoItems?.length) {
    parts.push(
      section.infoItems.map((i) => `${i.label}: ${i.value}`).join("\n"),
    );
  }
  if (section.paragraphs?.length) parts.push(section.paragraphs.join("\n"));
  if (section.listItems?.length) parts.push(section.listItems.join("\n"));
  return parts.filter(Boolean).join("\n");
}

function staticSiteCopyChunks(lang: "de" | "en"): RagChunkInput[] {
  const chunks: RagChunkInput[] = [];

  const landing = LANDING_COPY[lang];
  const landingContent = [
    landing.headline,
    landing.sub,
    "",
    ...landing.trustPoints,
  ].join("\n");
  {
    chunks.push(
      ...chunkSection({
        docId: "page:home",
        title: lang === "de" ? "Startseite" : "Home",
        href: `/${lang}`,
        sectionId: "hero",
        lang,
        visibility: "public",
        content: landingContent,
      }),
    );
  }

  const contact = CONTACT_COPY[lang];
  const contactContent = [
    contact.title,
    contact.subtitle,
    "",
    `${contact.asideTitle}: ${contact.asideBody}`,
    `${contact.responseLabel}: ${contact.responseValue}`,
    `${contact.scopeLabel}: ${contact.scopeValue}`,
  ].join("\n");
  {
    chunks.push(
      ...chunkSection({
        docId: "page:contact",
        title: lang === "de" ? "Kontakt" : "Contact",
        href: `/${lang}/contact`,
        sectionId: "copy",
        lang,
        visibility: "public",
        content: contactContent,
      }),
    );
  }

  const legal =
    lang === "de"
      ? [LEGAL_COPY.impressum_de, LEGAL_COPY.datenschutz_de]
      : [LEGAL_COPY.imprint_en, LEGAL_COPY.privacy_en];

  for (const page of legal) {
    const pageText = [
      page.title,
      page.subtitle,
      "",
      ...page.sections.map(legalSectionToText),
      page.note ? `\nNote: ${page.note}` : "",
    ]
      .join("\n\n")
      .trim();

    chunks.push(
      ...chunkSection({
        docId: `page:${page.href}`,
        title: page.title,
        href: page.href,
        sectionId: "legal",
        lang,
        visibility: "public",
        content: pageText,
      }),
    );
  }

  return chunks;
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
  deleted: number;
}> {
  const [caseStudies, thesis, experience, settings, categories, howIWork] = await Promise.all([
    getCaseStudies({ publishedOnly: true }),
    getThesis(),
    getExperience(),
    getSiteSettings(),
    getSkillCategories(),
    getHowIWorkPrinciples(),
  ]);

  const langs: Array<"de" | "en"> = ["de", "en"];

  const allChunks: RagChunkInput[] = [];
  for (const lang of langs) {
    for (const cs of caseStudies) allChunks.push(...caseStudyChunks(cs, lang));
    allChunks.push(...thesisChunks(thesis, lang));
    allChunks.push(...experienceChunks(experience, lang));
    allChunks.push(...siteSettingsChunks(settings, lang));
    allChunks.push(...skillsChunks(categories, lang));
    allChunks.push(...howIWorkChunks(howIWork, lang));
    allChunks.push(...staticSiteCopyChunks(lang));
    allChunks.push(...(await thesisAssetChunks(thesis, lang)));
    allChunks.push(...(await privateProfileChunks(lang)));
  }

  const existing = await ragGetExistingHashes();

  const pruneEnabled = process.env.RAG_PRUNE_MISSING === "1";
  const deleted = pruneEnabled
    ? (await ragPruneMissingIds({ ids: allChunks.map((c) => c.id) })).deleted
    : 0;

  const toUpsert = allChunks
    .map((c) => ({ ...c, content: c.content.trim() }))
    .filter((c) => Boolean(c.content))
    .map((c) => ({ chunk: c, hash: sha256(c.content) }))
    .filter(({ chunk, hash }) => existing.get(chunk.id) !== hash);

  const skipped = allChunks.length - toUpsert.length;

  const concRaw = Number(process.env.RAG_INGEST_CONCURRENCY ?? 2);
  const concurrency = Number.isFinite(concRaw)
    ? Math.min(6, Math.max(1, Math.floor(concRaw)))
    : 2;

  await mapWithConcurrency(toUpsert, concurrency, async ({ chunk, hash }) => {
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
    deleted,
  };
}
