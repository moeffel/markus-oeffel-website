# Sanity (CMS) schemas

This repo uses Sanity as a **headless CMS** (private dataset). The Next.js app reads data via GROQ queries (see `src/lib/cms/sanity.ts` and `src/lib/content/cms.ts`).

## What’s in here

- `schemaTypes/*`: document + object schemas you can drop into a Sanity Studio project.

## Setup (recommended)

1. Create a Sanity project + dataset (private).
2. Create a read token for the dataset (`SANITY_API_TOKEN`).
3. Copy `sanity/schemaTypes/*` into your studio and export them from your `schemaTypes/index.ts`.
4. Configure webhooks:
   - Publish → `POST /api/revalidate` with `x-webhook-signature` = HMAC-SHA256 hex over the raw JSON body using `WEBHOOK_HMAC_SECRET`.
5. Preview:
   - Use Next.js Draft Mode via `GET /api/draft/enable?secret=...&redirect=/en`.

