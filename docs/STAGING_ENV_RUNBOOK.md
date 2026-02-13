# Staging Env Runbook

Stand: 2026-02-11

## Ziel

Staging sicher deployen (noindex), danach kontrolliert auf Public umschalten (index).

Detail-Matrix für Vercel-Env-Werte: `docs/VERCEL_ENV_MATRIX.md`.

## Kernprinzip

- **Staging**: `ENABLE_PUBLIC_INDEXING` leer oder `false` → `noindex`, `robots: disallow`, leere Sitemap.
- **Production**: `ENABLE_PUBLIC_INDEXING=true` → indexierbar.

## Pflicht-Variablen für Soft-Launch

- `NEXT_PUBLIC_SITE_URL` (echte Staging-Domain, nicht localhost)
- `WEBHOOK_HMAC_SECRET`
- `DRAFT_MODE_SECRET`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- **Mindestens ein Mail-Provider:**
  - `RESEND_API_KEY` **oder**
  - `SMTP_HOST` + `SMTP_PORT` + `SMTP_USER` + `SMTP_PASS` (+ optional `SMTP_FROM_EMAIL`)

Optional:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- `OPENAI_API_KEY` + `SUPABASE_DB_URL`/`DATABASE_URL` (für volle RAG-Antworten)
- `NEXT_PUBLIC_PLAUSIBLE_SRC`

## Staging Setup (empfohlen)

1. Deployment-Env setzen:
   - `NEXT_PUBLIC_SITE_URL=https://<staging-domain>`
   - `ENABLE_PUBLIC_INDEXING=false` (oder ungesetzt)
   - restliche Pflicht-Secrets aus obiger Liste.
2. Build/CI grün laufen lassen.
3. Nach Deploy verifizieren:

```bash
curl -s https://<staging-domain>/robots.txt
curl -s https://<staging-domain>/sitemap.xml
```

Erwartung:
- `robots.txt` enthält Disallow-All.
- `sitemap.xml` enthält keine öffentlichen URLs.

## Public Umschalten

1. `ENABLE_PUBLIC_INDEXING=true` setzen.
2. `NEXT_PUBLIC_SITE_URL` auf produktive Domain prüfen.
3. Rechtstexte und Betreiberdaten final prüfen.
4. Neu deployen.
5. Verifizieren:

```bash
curl -s https://<prod-domain>/robots.txt
curl -s https://<prod-domain>/sitemap.xml
```

Erwartung:
- `robots.txt` erlaubt Crawling und referenziert Sitemap.
- `sitemap.xml` enthält `/de/*` und `/en/*` URLs.

## Lokale Readiness-Befehle

```bash
npm run deploy:check
npm run deploy:check:public
```
