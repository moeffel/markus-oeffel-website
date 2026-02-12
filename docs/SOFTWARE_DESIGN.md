# Software Design

Stand: 2026-02-10

## Ziele

- Klare Trennung zwischen Content-Domain, Rendering und Infrastruktur.
- Änderungen an Inhalt/UX ohne Seiteneffekte in API- oder Data-Layern.
- Wiederverwendbare Patterns für DE/EN-Fallbacks und Journey-Qualität.

## Layer-Modell

### 1) Presentation Layer (`src/app`, `src/components`)

- Verantwortlich für Rendering, Routing und UX-Flows.
- Nutzt ausschließlich vorverarbeitete View-Model-Daten für sprachabhängige Inhalte.
- Keine komplexe Datenableitungs- oder Fallback-Logik direkt in Page-Komponenten.

### 2) Content Application Layer (`src/lib/content`)

- Kapselt Content-Quellen (CMS + lokale Fallback-Daten).
- Liefert strukturierte Domain-Objekte (`CaseStudy`, `Thesis`, `ExperienceItem`, ...).
- View-Model-Mapper (`src/lib/content/view-models.ts`) transformieren Domain-Objekte zu UI-fertigen Daten.

### 3) Platform Layer (`src/lib/rag`, `src/lib/contact`, `src/lib/security`, `src/lib/cms`)

- Integrationen zu externen Diensten: OpenAI, Postgres/pgvector, Resend, Sanity, Turnstile.
- Security-Cross-Cutting: HMAC, rate limiting, captcha validation.
- API-Routen (`src/app/api/*`) orchestrieren Validierung, Guards und Plattformaufrufe.

## Kernprinzipien

- **Domain first**: Zod-Schemas sind die zentrale Vertragsquelle.
- **Transform early**: Lokalisierung/Fallbacks in View-Models, nicht in JSX verstreut.
- **Guard rails by default**: Security- und Abuse-Controls sind in API-Routen standardmäßig aktiv.
- **Composable UI**: Wiederkehrende UX-Muster als Komponenten kapseln (z. B. Übersetzungs-Hinweis).

## Neu eingeführte Design-Bausteine

- `src/lib/content/view-models.ts`
  - `createCaseStudyViewModel(...)`
  - `createThesisViewModel(...)`
  - Zentralisiert Sprach-Fallbacks und UI-nahe Datenableitungen.
- `src/components/translation-fallback-notice.tsx`
  - Einheitlicher DE/EN-Hinweis, wenn Inhalte aus der alternativen Sprache kommen.

## Qualitäts- und Teststrategie

- CI führt statische Gates (`lint`, `typecheck`, `build`) plus Header- und Smoke-Gates aus.
- Smoke-Gates:
  - `scripts/smoke-routes.mjs` für Journey-/Route-Basisabdeckung.
  - `scripts/smoke-api.mjs` für API-Vertragschecks.
- Ziel: schnelle Regressionserkennung ohne schweres E2E-Setup als Mindestschutz.

## Design-Backlog (nächste Iteration)

1. `view-models.ts` auf weitere Seiten ausweiten (Landing, Skills, Experience).
2. API-Fehlerformat in ein gemeinsames `problem+json`-ähnliches Schema überführen.
3. Domain-Service-Schnittstellen für RAG und Contact explizit typisieren (`ports/adapters` Pattern).
4. Spec-Dateien in `fintech-wow-portfolio-spec/SPEC/*` auf den implementierten Stand heben.
