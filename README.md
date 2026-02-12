# Markus Öffel's Website

Bilingual (DE/EN) personal website built with Next.js App Router.

## Features (v1)

- **CMS-driven content** via Sanity (private dataset) with Draft/Preview + publish webhooks.
- **Contact form** via Resend + Cloudflare Turnstile + distributed rate limiting (Upstash).
- **AI Assistant (“Ask”)**: RAG-only answers with citations (Supabase Postgres + pgvector + OpenAI).
- **SEO**: canonical + hreflang, sitemap/robots, template OG images, JSON-LD.
- **Security**: nonce-based CSP (prod), HSTS (prod), webhook HMAC auth, PII-redacted logging.

## Local development

1. Install deps:

```bash
npm install
```

2. Configure env vars:

```bash
cp .env.example .env.local
```

Notes:
- The site runs without most env vars (falls back to local placeholder content and disables captcha verification in dev).
- For production/staging you should set all required env vars.
- Landing-page profile photo is loaded from `public/profile.png`.

3. Run dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## CMS (Sanity)

Schemas live in `sanity/schemaTypes/*`. Setup notes are in `sanity/README.md`.

### Draft mode (Preview)

Enable:

`GET /api/draft/enable?secret=...&redirect=/en`

Disable:

`GET /api/draft/disable?secret=...&redirect=/en`

## Webhooks

### Revalidate (publish → ISR)

`POST /api/revalidate`

Auth: request header `x-webhook-signature` (or `x-signature`) is `hex(HMAC_SHA256(WEBHOOK_HMAC_SECRET, rawBody))`.

Body can include `{ type/documentType, slug }` (or explicit `paths: string[]`).

### Reindex (optional; publish → RAG ingestion)

`POST /api/reindex` with the same HMAC signature scheme.

## RAG (Ask)

### Database

Run the migration in `db/001_rag_chunks.sql` on your Supabase Postgres database (pgvector required).

### Ingest / Reindex

The vector store is filled via `POST /api/reindex` (HMAC-protected in prod).

Local dev shortcut:
- Set `ALLOW_DEV_UNSAFE_REINDEX=1` in `.env.local`
- Call:
  - `curl -sS -X POST http://localhost:3000/api/reindex | cat`

Optional tuning knobs:
- Retrieval: `ASK_TOP_K`, `ASK_CANDIDATES`, `ASK_MAX_PER_DOC`, `ASK_MIN_COSINE_SIMILARITY`
- Ingestion: `RAG_INGEST_CONCURRENCY`, `RAG_PRUNE_MISSING=1` (keeps the index clean when chunking changes)

### Private corpus

Create `private_corpus/high_profile_cv.md` (gitignored) or provide a Sanity `privateProfile` document.

## Analytics (Plausible)

Set `NEXT_PUBLIC_PLAUSIBLE_SRC` (and optionally `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`).

Tracked events (FR-100):
- `view_project`
- `open_case_study`
- `click_book_call`
- `submit_contact`
- `ask_query`
- `ask_click_source`

## Ops / Runbooks (quick)

- **Contact API down**: hide/disable the form and show a mailto fallback (and/or set Resend env vars).
- **Ask budget exceeded**: increase `ASK_DAILY_LIMIT` (or `ASK_DAILY_BUDGET_USD`) or wait for the daily window to reset.
- **Webhook failing**: verify HMAC secret and raw-body signing; manually call `/api/revalidate`.

## CI

GitHub Actions workflow: lint + typecheck + build + header audit (CSP) + route/API smokes.

## Deploy readiness

Run local readiness checks before staging/production rollout:

```bash
npm run deploy:check
npm run deploy:check:public
```

Checklist and rollout phases are documented in `docs/DEPLOY_CHECKLIST.md`.
Staging env rollout (noindex → index switch) is documented in `docs/STAGING_ENV_RUNBOOK.md`.
Vercel env mapping (Preview vs Production) is documented in `docs/VERCEL_ENV_MATRIX.md`.

## Software design

See `docs/SOFTWARE_DESIGN.md` for architecture layers, design principles, and next design backlog.

## Tooling: Playwright CLI

See `docs/TOOLS_PLAYWRIGHT_CLI.md` for install status, demo flow, and the standard automation workflow used to evolve the UI iteratively.
