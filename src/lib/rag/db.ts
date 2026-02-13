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
  distance: number;
};

let pool: Pool | null = null;

function shouldUseSsl(connectionString: string): boolean {
  const lower = connectionString.toLowerCase();
  if (lower.includes("sslmode=require")) return true;
  if (lower.includes("ssl=true")) return true;
  if (lower.includes("pgbouncer=true")) return true;
  return false;
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString =
    process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing SUPABASE_DB_URL (or DATABASE_URL).");
  }

  const wantsSsl =
    process.env.NODE_ENV === "production" || shouldUseSsl(connectionString);

  const familyRaw = (process.env.PG_FAMILY ?? "").trim();
  const family = familyRaw === "4" ? 4 : familyRaw === "6" ? 6 : undefined;

  const timeoutRaw = (process.env.PG_CONNECT_TIMEOUT_MS ?? "").trim();
  const timeoutParsed = timeoutRaw ? Number(timeoutRaw) : NaN;
  const connectionTimeoutMillis = Number.isFinite(timeoutParsed) && timeoutParsed > 0
    ? Math.floor(timeoutParsed)
    : process.env.NODE_ENV === "production"
      ? 10_000
      : 5_000;

  pool = new Pool({
    connectionString,
    max: 5,
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
    ...(family ? { family } : {}),
    connectionTimeoutMillis,
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
        updated_at,
        (embedding <=> $3::vector) as distance
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

export async function ragKeywordSearch(input: {
  lang: "de" | "en";
  topK: number;
  visibilities: RagVisibility[];
  tokens: readonly string[];
}): Promise<RagChunkRow[]> {
  const p = getPool();
  const tokens = Array.from(
    new Set(
      input.tokens
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length >= 2),
    ),
  ).slice(0, 8);

  if (tokens.length === 0) return [];

  const params: unknown[] = [input.lang, input.visibilities];
  const matchClauses: string[] = [];
  const scoreClauses: string[] = [];

  for (const token of tokens) {
    params.push(`%${token}%`);
    const idx = params.length;
    matchClauses.push(
      `(title ilike $${idx} or section_id ilike $${idx} or content ilike $${idx})`,
    );
    scoreClauses.push(
      `(case when title ilike $${idx} then 3 else 0 end +
        case when section_id ilike $${idx} then 2 else 0 end +
        case when content ilike $${idx} then 1 else 0 end)`,
    );
  }

  params.push(input.topK);
  const topKParam = params.length;

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
        updated_at,
        2::float as distance
      from rag_chunks
      where lang = $1
        and visibility = any($2::text[])
        and (${matchClauses.join(" or ")})
      order by (${scoreClauses.join(" + ")}) desc, updated_at desc
      limit $${topKParam}
    `,
    params,
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

export async function ragPruneMissingIds(input: {
  ids: readonly string[];
}): Promise<{ deleted: number }> {
  const p = getPool();
  if (input.ids.length === 0) return { deleted: 0 };

  const { rowCount } = await p.query(
    `
      delete from rag_chunks
      where not (id = any($1::text[]))
    `,
    [input.ids],
  );

  return { deleted: rowCount ?? 0 };
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
