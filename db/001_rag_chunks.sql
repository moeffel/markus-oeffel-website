-- RAG vector store table (Supabase Postgres + pgvector)

-- Enable pgvector
create extension if not exists vector;

create table if not exists rag_chunks (
  id text primary key,
  doc_id text not null,
  title text not null,
  href text,
  section_id text not null,
  lang text not null check (lang in ('de', 'en')),
  visibility text not null check (visibility in ('public', 'private')),
  content text not null,
  content_hash text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);

create index if not exists rag_chunks_lang_visibility_idx
  on rag_chunks (lang, visibility);

-- Note: IVFFLAT requires `ANALYZE rag_chunks;` after you insert enough rows.
-- You can also use HNSW if available in your pgvector version.
create index if not exists rag_chunks_embedding_ivfflat_idx
  on rag_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

