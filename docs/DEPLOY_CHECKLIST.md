# Deploy Checklist

Stand: 2026-02-11

## Ziel

Schrittweise von lokalem Build zu sicherem Soft-Launch und anschließend Public-Launch gehen.

## Phasen

### Phase 1 — Soft-Launch (stabil + erreichbar)

- [ ] Domain + Runtime-Env gesetzt (`NEXT_PUBLIC_SITE_URL`, Webhook/Draft-Secrets, Contact-Env).
- [ ] `ENABLE_PUBLIC_INDEXING=false` für Staging (oder ungesetzt).
- [ ] Basis-Git-Historie vorhanden und sauberer Working Tree.
- [ ] Keine Placeholder-Links mehr in Content (`example.com`, Dummy Calendly/CV).
- [ ] CI grün (`lint`, `typecheck`, `build`, Header-Audit, Route-Smoke, API-Smoke).
- [ ] API-Smoke im erwarteten Betriebsmodus grün:
  - `/api/ask` entweder als 200-Contract,
  - oder kontrolliert degradiert (`captcha_required`, `budget_exceeded`, `provider_error`).
- [ ] Kontaktformular produktiv getestet (echte Zustellung mit Resend).
- [ ] Ask-Verhalten entschieden:
  - entweder RAG produktiv (OpenAI + DB),
  - oder bewusst Corpus-Fallback als Soft-Launch-Modus.

### Phase 2 — Public-Launch (rechtlich + SEO sauber)

- [ ] Impressum/Imprint mit finalen Betreiberdaten (Name, ladungsfähige Anschrift, finale Mail).
- [ ] Datenschutz/Privacy final rechtlich geprüft.
- [ ] Staging noindex / Production index klar getrennt.
- [ ] `ENABLE_PUBLIC_INDEXING=true` explizit erst für Public gesetzt.
- [ ] Placeholder-/Draft-Formulierungen in Legal-Texten entfernt.
- [ ] Analytics + Incident-Monitoring aktiv (mindestens Plausible + Server Logs/Alerts).

## Automatisierbarer Readiness-Check

Es gibt jetzt einen lokalen Readiness-Check:

```bash
# Soft-Launch readiness
npm run deploy:check

# Public-Launch readiness (inkl. Legal/SEO-Härte)
npm run deploy:check:public
```

Der Check prüft u. a. Env-Variablen, Git-Status, Placeholder-Links und Legal-Placeholders.

Für konkrete Staging/Production-Env-Schritte siehe `docs/STAGING_ENV_RUNBOOK.md`.
Für konkrete Vercel-Variablen je Umgebung siehe `docs/VERCEL_ENV_MATRIX.md`.

## Aktuelle Empfehlung

1. **Soft-Launch zuerst** (passwortgeschützt oder kleiner Beta-Kreis).
2. Danach **Public-Launch** erst nach finaler Rechtstext- und SEO-Freigabe.
