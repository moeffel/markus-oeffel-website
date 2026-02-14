# Vercel Env Matrix & Launch-Reihenfolge

Stand: 2026-02-11

## Ziel

Konkrete Belegung der Vercel-Umgebungen (Preview/Staging vs Production) inkl. Reihenfolge für einen sicheren Soft-Launch und Public-Launch.

## Vercel-Umgebungen

- `Preview` = Staging/Soft-Launch (noindex)
- `Production` = Public-Launch (index)
- `Development` = lokale Defaults (optional in Vercel)

## Pflichtwerte (beide Umgebungen)

| Variable | Preview (Staging) | Production |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<staging-domain>` | `https://<prod-domain>` |
| `WEBHOOK_HMAC_SECRET` | `<random-64hex>` | `<random-64hex>` |
| `DRAFT_MODE_SECRET` | `<random-64hex>` | `<random-64hex>` |
| `CONTACT_PROVIDER` | `auto` | `auto` |
| `ENABLE_PUBLIC_INDEXING` | `false` (oder leer) | `true` |

## Optionale, aber empfohlene Werte

| Variable | Preview (Staging) | Production |
|---|---|---|
| `RESEND_API_KEY` | `<resend-api-key>` | `<resend-api-key>` |
| `CONTACT_TO_EMAIL` oder `RESEND_TO_EMAIL` | `<inbox@domain>` | `<inbox@domain>` |
| `CONTACT_FROM_EMAIL` oder `RESEND_FROM_EMAIL` | `<from@domain>` | `<from@domain>` |
| `CONTACT_ALLOW_RESEND_ONBOARDING_FROM` | `true` (default) | `false` (empfohlen nach Setup) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `<turnstile-site-key>` | `<turnstile-site-key>` |
| `TURNSTILE_SECRET_KEY` | `<turnstile-secret>` | `<turnstile-secret>` |
| `SMTP_HOST` | `<smtp-host>` (falls kein Resend) | `<smtp-host>` (falls kein Resend) |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_SECURE` | `false` (oder `true` bei 465) | `false` (oder `true` bei 465) |
| `SMTP_USER` | `<smtp-user>` | `<smtp-user>` |
| `SMTP_PASS` | `<smtp-pass>` | `<smtp-pass>` |
| `SMTP_FROM_EMAIL` oder `SMTP_USER` | `<from@domain>` | `<from@domain>` |
| `SMTP_TO_EMAIL` | `<inbox@domain>` (optional alias) | `<inbox@domain>` (optional alias) |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | `<plausible-script-url>` | `<plausible-script-url>` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `<staging-domain>` oder leer | `<prod-domain>` oder leer |
| `OPENAI_API_KEY` | `<openai-key>` | `<openai-key>` |
| `SUPABASE_DB_URL` oder `DATABASE_URL` | `<db-url>` | `<db-url>` |
| `ASK_ENABLE_LLM` | `0` (empfohlen für Low-Cost Staging) | `0` oder `1` |
| `ASK_ENABLE_VECTOR_RAG` | `0` | `0` oder `1` |
| `UPSTASH_REDIS_REST_URL` | `<upstash-url>` | `<upstash-url>` |
| `UPSTASH_REDIS_REST_TOKEN` | `<upstash-token>` | `<upstash-token>` |
| `SANITY_PROJECT_ID` | `<sanity-project>` | `<sanity-project>` |
| `SANITY_DATASET` | `<sanity-dataset>` | `<sanity-dataset>` |
| `SANITY_API_TOKEN` | `<sanity-token>` | `<sanity-token>` |
| `ASK_DAILY_LIMIT` oder `ASK_DAILY_BUDGET_USD` | z. B. `200` | z. B. `1000` |

## Feste Defaults (können identisch sein)

| Variable | Wert |
|---|---|
| `SANITY_API_VERSION` | `2025-02-06` |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-small` |
| `ASK_TOP_K` | `8` |
| `ASK_MAX_TOKENS` | `450` |
| `ASK_ESTIMATED_COST_USD` | `0.01` |

## Secret-Generierung

```bash
openssl rand -hex 32
```

Nutzen für `WEBHOOK_HMAC_SECRET` und `DRAFT_MODE_SECRET` (je Secret separat generieren).

## Launch-Reihenfolge (Go/No-Go)

1. **Vercel Variablen setzen (Preview + Production)**
   - in Vercel: `Project → Settings → Environment Variables`.
   - Keine lokalen Platzhalter (`localhost`) in `NEXT_PUBLIC_SITE_URL`.
2. **Preview deployen**
   - Erwartung: `ENABLE_PUBLIC_INDEXING=false` und noindex aktiv.
3. **Staging-Checks**
   - `npm run deploy:check`
   - `curl -s https://<staging-domain>/robots.txt`
   - `curl -s https://<staging-domain>/sitemap.xml`
4. **Soft-Launch Go/No-Go**
   - Go nur wenn: Typecheck/Build/Smokes grün, Contact-Flow getestet, Legal-Content konsistent.
5. **Production umschalten**
   - `ENABLE_PUBLIC_INDEXING=true` (nur Production).
   - Re-deploy aus stabilem Branch/Commit.
6. **Public-Checks**
   - `npm run deploy:check:public`
   - `curl -s https://<prod-domain>/robots.txt`
   - `curl -s https://<prod-domain>/sitemap.xml`
7. **Public Go/No-Go**
   - Go nur wenn: Legal final, Indexing korrekt, Monitoring aktiv.

## Typische Fehlerbilder

- `deploy:check` meldet fehlende Env-Werte → Variablen in Vercel fehlen oder sind nur in falscher Umgebung gesetzt.
- Sitemap bleibt leer in Production → `ENABLE_PUBLIC_INDEXING` nicht auf `true` in Production.
- Contact API `provider_not_configured` → prüfe zuerst `CONTACT_TO_EMAIL` (oder `RESEND_TO_EMAIL`/`SMTP_TO_EMAIL`) und dann mindestens einen Providerpfad:
  - Resend: `RESEND_API_KEY` + (`CONTACT_FROM_EMAIL` oder `RESEND_FROM_EMAIL`)
  - SMTP: `SMTP_HOST` + (`SMTP_FROM_EMAIL` oder `SMTP_USER`)
- Contact API `provider_error` → Provider lehnt Versand ab (API-Key/Auth/From-Domain prüfen).
- Ask API degradiert (`budget_exceeded`/`provider_error`) → Budget/Provider/DB prüfen.
