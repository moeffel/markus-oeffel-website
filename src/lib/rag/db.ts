import { Pool } from "pg";

export type RagVisibility = "public" | "private";

export type RagChunkRow = {
  id: string;
  doc_id: string;
  title: string;
  href: string | null;
  section_id: string;
  lang: string;
  visibility: RagVisibility;
  content: string;
  content_hash: string;
  updated_at: string;
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString =
    process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing SUPABASE_DB_URL (or DATABASE_URL).");
  }

  pool = new Pool({
    connectionString,
    max: 5,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  return pool;
}

function toPgVector(embedding: number[]): string {
  return `[${embedding.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

export async function ragVectorSearch(input: {
  embedding: number[];
  lang: "de" | "en";
  topK: number;
  visibilities: RagVisibility[];
}): Promise<RagChunkRow[]> {
  const p = getPool();

  const embedding = toPgVector(input.embedding);
  const { rows } = await p.query<RagChunkRow>(
    `
      select
        id,
        doc_id,
        title,
        href,
        section_id,
        lang,
        visibility,
        content,
        content_hash,
        updated_at
      from rag_chunks
      where lang = $1
        and visibility = any($2::text[])
      order by embedding <=> $3::vector
      limit $4
    `,
    [input.lang, input.visibilities, embedding, input.topK],
  );

  return rows;
}

export async function ragGetExistingHashes(): Promise<Map<string, string>> {
  const p = getPool();
  const { rows } = await p.query<{ id: string; content_hash: string }>(
    `select id, content_hash from rag_chunks`,
  );

  const map = new Map<string, string>();
  for (const row of rows) map.set(row.id, row.content_hash);
  return map;
}

export async function ragUpsertChunk(input: {
  id: string;
  docId: string;
  title: string;
  href: string | null;
  sectionId: string;
  lang: "de" | "en";
  visibility: RagVisibility;
  content: string;
  contentHash: string;
  embedding: number[];
}): Promise<void> {
  const p = getPool();
  const embedding = toPgVector(input.embedding);

  await p.query(
    `
    insert into rag_chunks (
      id, doc_id, title, href, section_id, lang, visibility,
      content, content_hash, embedding, updated_at
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
    on conflict (id) do update set
      doc_id = excluded.doc_id,
      title = excluded.title,
      href = excluded.href,
      section_id = excluded.section_id,
      lang = excluded.lang,
      visibility = excluded.visibility,
      content = excluded.content,
      content_hash = excluded.content_hash,
      embedding = excluded.embedding,
      updated_at = now()
  `,
    [
      input.id,
      input.docId,
      input.title,
      input.href,
      input.sectionId,
      input.lang,
      input.visibility,
      input.content,
      input.contentHash,
      embedding,
    ],
  );
}
