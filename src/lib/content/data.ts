import { z } from "zod";

import {
  caseStudySchema,
  experienceItemSchema,
  howIWorkPrincipleSchema,
  skillCategorySchema,
  siteSettingsSchema,
  thesisSchema,
  type CaseStudy,
  type ExperienceItem,
  type HowIWorkPrinciple,
  type SkillCategory,
  type SiteSettings,
  type Thesis,
} from "@/lib/content/schemas";
import type { Language } from "@/lib/i18n";

const caseStudies = z.array(caseStudySchema).parse([
  {
    slug: "realtime-fraud-scoring",
    title: {
      de: "Realtime Fraud Scoring",
      en: "Realtime fraud scoring",
    },
    subtitle: {
      de: "Risk-Engine + Streaming Pipeline",
      en: "Risk engine + streaming pipeline",
    },
    summary: {
      de: "Signals → Score → Decisioning. Optimiert für Latency, Auditability und Cost.",
      en: "Signals → score → decisioning. Optimized for latency, auditability, and cost.",
    },
    tags: ["risk", "fraud", "streaming"],
    domains: ["risk", "data", "infra"],
    highlightMetrics: [
      {
        label: { de: "p95 Latency", en: "p95 latency" },
        value: "< 120ms",
      },
      {
        label: { de: "Explainability", en: "Explainability" },
        value: "Cited rules",
      },
    ],
    stack: ["TypeScript", "Postgres", "Kafka", "Redis"],
    links: [
      {
        label: "Architecture deep-dive (contact)",
        url: "https://fintech-wow.dev/en/contact",
      },
    ],
    published: true,
    order: 1,
    date: "2026-02-01",
    context: {
      de: "Payments-Produkt mit steigender Fraud-Rate und strikten SLA/Compliance Constraints.",
      en: "Payments product with rising fraud and strict SLA/compliance constraints.",
    },
    problem: {
      de: "Zu viele False Positives + zu langsame Decisions → Conversion leidet, Risk steigt.",
      en: "Too many false positives + slow decisions → conversion drops, risk increases.",
    },
    solution: {
      de: [
        "Streaming Feature Pipeline mit klaren SLAs.",
        "Rule + model hybrid (kostenkontrolliert).",
        "Audit trail je Entscheidung (welche Signale, welche Regeln).",
      ],
      en: [
        "Streaming feature pipeline with clear SLAs.",
        "Hybrid rule + model (cost-controlled).",
        "Per-decision audit trail (signals + rules).",
      ],
    },
    constraints: {
      de: [
        "PCI-ish Kontext: minimal data, strict logging.",
        "Latency-Budget: sub-second end-to-end.",
        "Explainability für Trust & Ops.",
      ],
      en: [
        "PCI-ish context: minimal data, strict logging.",
        "Latency budget: sub-second end-to-end.",
        "Explainability for trust & ops.",
      ],
    },
    architecture: {
      type: "text",
      payload: {
        de: "Ingestion → feature store → scorer → decisioning API; alles event-driven.",
        en: "Ingestion → feature store → scorer → decisioning API; all event-driven.",
      },
    },
    yourRole: {
      de: ["Lead Engineer", "System Design", "Delivery + Ops"],
      en: ["Lead engineer", "System design", "Delivery + ops"],
    },
    impact: {
      de: [
        { text: "Reduzierte False Positives (qualitativ).", qualitative: true },
        { text: "Stabilere SLAs durch Backpressure + SLOs.", qualitative: true },
        { text: "Weniger Ops-Pain durch auditierbare Decisions.", qualitative: true },
      ],
      en: [
        { text: "Reduced false positives (qualitative).", qualitative: true },
        { text: "More stable SLAs via backpressure + SLOs.", qualitative: true },
        { text: "Less ops pain via auditable decisions.", qualitative: true },
      ],
    },
    learnings: {
      de: [
        "“Fast” ohne Observability ist Zufall.",
        "Explainability ist ein Product Feature.",
      ],
      en: [
        "“Fast” without observability is luck.",
        "Explainability is a product feature.",
      ],
    },
    confidentialityLevel: "redacted",
  },
  {
    slug: "kyc-onboarding",
    title: {
      de: "KYC Onboarding",
      en: "KYC onboarding",
    },
    subtitle: {
      de: "From signup to verified",
      en: "From signup to verified",
    },
    summary: {
      de: "Sauberer Funnel mit klarer UX, Daten-Minimierung und verlässlichen Verifikations-Signalen.",
      en: "A clean funnel with strong UX, data minimization, and reliable verification signals.",
    },
    tags: ["kyc", "compliance", "ux"],
    domains: ["kyc", "payments"],
    highlightMetrics: [
      { label: { de: "Drop-off", en: "Drop-off" }, value: "↓" },
      { label: { de: "Review Time", en: "Review time" }, value: "↓" },
    ],
    stack: ["Next.js", "TypeScript", "Postgres"],
    links: [
      {
        label: "Discuss onboarding setup",
        url: "https://fintech-wow.dev/en/contact",
      },
    ],
    published: true,
    order: 2,
    date: "2025-11-15",
    context: {
      de: "Regulierter Kontext: Identitätsprüfung, Audits, klare Data Retention Regeln.",
      en: "Regulated context: identity verification, audits, clear data retention rules.",
    },
    problem: {
      de: "KYC war langsam, unklar und schwer zu debuggen.",
      en: "KYC was slow, unclear, and hard to debug.",
    },
    solution: {
      de: [
        "State machine für Onboarding Steps.",
        "Provider abstraction + retries.",
        "Event logging (PII redacted) + dashboards.",
      ],
      en: [
        "State machine for onboarding steps.",
        "Provider abstraction + retries.",
        "Event logging (PII redacted) + dashboards.",
      ],
    },
    constraints: {
      de: [
        "PII minimieren (privacy-by-design).",
        "Idempotenz + Retries.",
        "Auditability.",
      ],
      en: [
        "Minimize PII (privacy-by-design).",
        "Idempotency + retries.",
        "Auditability.",
      ],
    },
    yourRole: {
      de: ["Architecture", "Implementation", "Stakeholder alignment"],
      en: ["Architecture", "Implementation", "Stakeholder alignment"],
    },
    impact: {
      de: [
        { text: "Weniger Drop-off (qualitativ).", qualitative: true },
        { text: "Klarer Debuggability via event trail.", qualitative: true },
        { text: "Compliance-ready flows by default.", qualitative: true },
      ],
      en: [
        { text: "Lower drop-off (qualitative).", qualitative: true },
        { text: "Clear debugability via event trail.", qualitative: true },
        { text: "Compliance-ready flows by default.", qualitative: true },
      ],
    },
    confidentialityLevel: "public",
  },
  {
    slug: "fintech-wow-portfolio-website",
    title: {
      de: "Markus Öffel's Website",
      en: "Markus Öffel's Website",
    },
    subtitle: {
      de: "Persönliche Website mit Case-Engine",
      en: "Personal website with case engine",
    },
    summary: {
      de: "Mehrsprachige persönliche Website mit strukturierten Case-Studies, Ask-/Contact-Flows und deploy-fähigem QA-Setup.",
      en: "Bilingual personal website with structured case studies, ask/contact flows, and deployment-ready QA setup.",
    },
    tags: ["portfolio", "nextjs", "i18n", "playwright", "deploy"],
    domains: ["ai", "data", "infra", "other"],
    highlightMetrics: [
      { label: { de: "Sprachen", en: "Locales" }, value: "2 (DE/EN)" },
      {
        label: { de: "Core Routen", en: "Core routes" },
        value: "11+ smoke-checked",
      },
      {
        label: { de: "Deploy Checks", en: "Deploy checks" },
        value: "17 readiness gates",
      },
    ],
    stack: [
      "Next.js 16",
      "TypeScript",
      "Zod",
      "Playwright CLI",
      "Node.js",
      "Vercel-ready setup",
    ],
    links: [
      { label: "Live site", url: "https://fintech-wow.dev" },
      {
        label: "DataCamp Data Analyst",
        url: "https://fintech-wow.dev/certificates/datacamp-data-analyst-in-python.pdf",
      },
      {
        label: "Coursera Advanced Data Analytics",
        url: "https://fintech-wow.dev/certificates/coursera-google-advanced-data-analytics-z0mbgwk4z33c.pdf",
      },
      {
        label: "Certification pack (contact)",
        url: "https://fintech-wow.dev/en/contact",
      },
    ],
    published: true,
    order: 3,
    date: "2026-02-11",
    context: {
      de: "Die Website dient als zentrale Trust-Fläche für FinTech-, Data- und AI-Projekte inklusive rechtlicher, technischer und inhaltlicher Baseline.",
      en: "The website acts as a central trust surface for fintech, data, and AI work with legal, technical, and content baselines.",
    },
    problem: {
      de: "Vorher fehlte ein konsistenter öffentlicher Auftritt mit nachvollziehbaren Projektdetails, Zertifikatsnachweisen und klarer Kontaktführung.",
      en: "Previously there was no consistent public presence with traceable project details, certification evidence, and clear contact routing.",
    },
    solution: {
      de: [
        "Portfolio als modulares Next.js-System mit DE/EN-Routing, Case-Detailseiten und Content-Validierung aufgebaut.",
        "Playwright-basierte Route-Smokes und Deploy-Readiness-Checks für QA/Go-live etabliert.",
        "Zertifikate, Thesis, CV und Legal-Seiten in ein einheitliches Finance/Cyber-Design integriert.",
      ],
      en: [
        "Built the portfolio as a modular Next.js system with DE/EN routing, case detail pages, and content validation.",
        "Established Playwright-driven route smokes and deploy-readiness checks for QA and go-live.",
        "Integrated certifications, thesis, CV, and legal pages into one consistent finance/cyber design language.",
      ],
    },
    constraints: {
      de: [
        "Datenschutz- und Legal-Basics mussten vor dem Soft-Launch konsistent dokumentiert sein.",
        "Deployment musste zwischen Staging-noindex und Public-index sauber umschaltbar bleiben.",
        "Inhalte mussten schnell aktualisierbar, aber schema-valide und mehrsprachig sein.",
      ],
      en: [
        "Privacy and legal basics had to be consistently documented before soft launch.",
        "Deployment had to switch cleanly between staging-noindex and public-indexing.",
        "Content had to stay quickly editable while remaining schema-valid and bilingual.",
      ],
    },
    architecture: {
      type: "text",
      payload: {
        de: "Content-Layer (schema-validiert) → View-Models → Next.js App Router Seiten; ergänzt durch Smoke-/Readiness-Skripte.",
        en: "Content layer (schema-validated) → view models → Next.js App Router pages; complemented by smoke/readiness scripts.",
      },
    },
    yourRole: {
      de: ["Product & UX direction", "System Design", "Implementation", "QA & Deploy prep"],
      en: ["Product & UX direction", "System design", "Implementation", "QA & deploy prep"],
    },
    impact: {
      de: [
        { text: "Öffentlicher Portfolio-Flow mit 2 Sprachen und strukturierten Case-Dossiers bereitgestellt." },
        { text: "8 Zertifikatsdokumente als verlinkbare Nachweise in die Website integriert." },
        { text: "Deploy-Readiness mit 17 systematischen Checks für Soft-/Public-Launch etabliert." },
        { text: "Route-Smoke deckt 11+ kritische Seitenpfade für Regression-Checks ab." },
      ],
      en: [
        { text: "Delivered a public portfolio flow in 2 locales with structured case dossiers." },
        { text: "Integrated 8 certification documents as linkable evidence assets." },
        { text: "Established deploy readiness with 17 systematic checks for soft/public launch." },
        { text: "Route smoke covers 11+ critical page paths for regression checks." },
      ],
    },
    learnings: {
      de: [
        "Ein starkes Portfolio ist ein Produkt und braucht denselben Qualitätsanspruch wie Kunden-Software.",
        "Rechtstexte, Content-Model und technische QA sollten von Anfang an zusammen gedacht werden.",
      ],
      en: [
        "A strong portfolio is a product and needs the same quality bar as client software.",
        "Legal text, content model, and technical QA should be designed together from the start.",
      ],
    },
    confidentialityLevel: "public",
  },
  {
    slug: "thesis",
    title: {
      de: "Masterarbeit: ARIMA-GARCH in Krypto-Märkten",
      en: "Master’s thesis: ARIMA-GARCH in crypto markets",
    },
    subtitle: {
      de: "BTC · ETH · DOGE · SOL",
      en: "BTC · ETH · DOGE · SOL",
    },
    summary: {
      de: "Out-of-sample Evaluation von ARIMA-GARCH für Return-Prognosen, Volatilität und 5%-VaR in vier Krypto-Assets.",
      en: "Out-of-sample evaluation of ARIMA-GARCH for return forecasting, volatility, and 5% VaR across four crypto assets.",
    },
    tags: ["thesis", "arima", "garch", "crypto", "risk"],
    domains: ["investment", "risk", "data", "ai"],
    highlightMetrics: [
      { label: { de: "Assets", en: "Assets" }, value: "4 (BTC/ETH/DOGE/SOL)" },
      {
        label: { de: "Zeitraum", en: "Sample period" },
        value: "2020-05-11 → 2024-04-20",
      },
      { label: { de: "Horizonte", en: "Horizons" }, value: "1/3/7/14/30 Tage" },
    ],
    stack: ["Python", "pandas", "statsmodels", "arch", "yfinance", "SciPy"],
    links: [
      { label: "Thesis PDF", url: "https://fintech-wow.dev/thesis.pdf" },
      { label: "Notebook walkthrough", url: "https://fintech-wow.dev/notebook.html" },
      {
        label: "Notebook source (full .ipynb)",
        url: "https://fintech-wow.dev/notebooks/thesis-arima-garch-walkthrough.ipynb",
      },
      {
        label: "Notebook source (interview .ipynb)",
        url: "https://fintech-wow.dev/notebooks/thesis-arima-garch-interview.ipynb",
      },
      {
        label: "Python implementation (on request)",
        url: "https://fintech-wow.dev/en/contact",
      },
    ],
    published: true,
    order: 0,
    date: "2025-12-01",
    context: {
      de: "Krypto-Märkte sind 24/7, volatil und regime-anfällig. Institutionelle Adoption erhöht den Bedarf an belastbarer Risiko-Modellierung.",
      en: "Crypto markets are 24/7, volatile, and regime-sensitive. Institutional adoption increases the need for robust risk modeling.",
    },
    problem: {
      de: "Wie gut kann ein ARIMA-GARCH-Framework Return- und Volatilitätsdynamik vorhersagen, und wie stark unterscheidet sich die Güte je Asset?",
      en: "How accurately can an ARIMA-GARCH framework predict return and volatility dynamics, and how much does performance vary by asset?",
    },
    solution: {
      de: [
        "Historische Tagesdaten für BTC, ETH, DOGE und SOL via yfinance geladen (2020-05-11 bis 2024-04-20).",
        "Preprocessing auf Log-Returns, Time-Split und robuste Diagnostik (u. a. ADF/KPSS, Ljung-Box, ARCH-LM).",
        "Auto-Tuning über ARIMA + GARCH-Familie (GARCH/GJR/FIGARCH/EGARCH) mit AIC und Parametersignifikanz.",
        "Out-of-sample Bewertung als Multi-Horizon-Setup und adaptiver Rolling-Backtest (60 Tage + Robustness mit 365 Tagen).",
        "Vergleich gegen Naive- und EWMA-Benchmarks mit Diebold-Mariano sowie Kupiec-/Christoffersen-VaR-Tests.",
      ],
      en: [
        "Loaded daily historical data for BTC, ETH, DOGE, and SOL via yfinance (2020-05-11 to 2024-04-20).",
        "Applied preprocessing on log returns, time-based splits, and diagnostics (including ADF/KPSS, Ljung-Box, ARCH-LM).",
        "Auto-tuned ARIMA + GARCH-family models (GARCH/GJR/FIGARCH/EGARCH) via AIC and parameter significance.",
        "Evaluated out-of-sample in multi-horizon mode and adaptive rolling backtests (60 days + 365-day robustness).",
        "Benchmarked against naive and EWMA with Diebold-Mariano tests and Kupiec/Christoffersen VaR backtests.",
      ],
    },
    constraints: {
      de: [
        "Starke Heavy-Tails und volatile Regimewechsel im 24/7-Markt.",
        "Hohe Anforderungen an Reproduzierbarkeit und methodische Transparenz.",
        "Statistische Signifikanz muss gegen reale Risk-Use-Cases validiert werden.",
      ],
      en: [
        "Heavy tails and regime shifts in a 24/7 market environment.",
        "High bar for reproducibility and methodological transparency.",
        "Statistical significance must hold up in practical risk workflows.",
      ],
    },
    architecture: {
      type: "mermaid",
      payload: {
        de: "graph LR\nA[Yahoo Finance Daten] --> B[Preprocessing: Log-Returns]\nB --> C[Split: 70/15/15]\nC --> D[Auto-Tuning via AIC]\nD --> E[ARIMA + GARCH-Fit]\nE --> F[Forecasts h=1,3,7,14,30]\nF --> G[DM-Tests vs Naive/EWMA]\nF --> H[VaR 5% Backtests]",
        en: "graph LR\nA[Yahoo Finance data] --> B[Preprocessing: log returns]\nB --> C[Split: 70/15/15]\nC --> D[Auto-tuning via AIC]\nD --> E[ARIMA + GARCH fit]\nE --> F[Forecasts h=1,3,7,14,30]\nF --> G[DM tests vs naive/EWMA]\nF --> H[5% VaR backtests]",
      },
    },
    yourRole: {
      de: [
        "Research Design",
        "Ökonometrische Modellierung",
        "Python-Implementierung",
        "Ergebnisanalyse",
        "Wissenschaftliches Schreiben",
      ],
      en: [
        "Research design",
        "Econometric modeling",
        "Python implementation",
        "Result analysis",
        "Academic writing",
      ],
    },
    impact: {
      de: [
        { text: "4 Assets in einem konsistenten ARIMA-GARCH-Setup verglichen (BTC, ETH, DOGE, SOL)." },
        { text: "Für SOL signifikante Return-Verbesserungen bei 7- und 14-Tage-Horizonten erzielt." },
        { text: "5%-VaR-Backtests im 60-Tage-Setup für BTC, DOGE und SOL bestanden." },
        { text: "ETH-Robustness-Check zeigt: 365-Tage-Window behebt VaR-Fehlschläge des 60-Tage-Setups." },
      ],
      en: [
        { text: "Compared 4 assets in one consistent ARIMA-GARCH framework (BTC, ETH, DOGE, SOL)." },
        { text: "For SOL, achieved significant return improvements at 7- and 14-day horizons." },
        { text: "Passed 5% VaR backtests for BTC, DOGE, and SOL in the adaptive 60-day setup." },
        { text: "ETH robustness check shows that a 365-day window fixes VaR failures seen with 60 days." },
      ],
    },
    learnings: {
      de: [
        "Kurzfristige Return-Prognosen bleiben nahe am Random-Walk-Benchmark.",
        "Stärke des Frameworks liegt in Volatilitäts- und Risiko-Modellierung, nicht im Day-to-Day-Alpha.",
        "Window-Größe ist bei adaptiven Modellen ein zentraler Hebel für Robustheit.",
      ],
      en: [
        "Short-horizon return forecasts stay close to the random-walk benchmark.",
        "The framework is strongest in volatility and risk modeling, not day-to-day alpha.",
        "Window length is a primary robustness lever in adaptive model setups.",
      ],
    },
    confidentialityLevel: "public",
  },
]);

const thesis = thesisSchema.parse({
  title: {
    de: "Masterarbeit: ARIMA-GARCH in Krypto-Märkten",
    en: "Master’s thesis: ARIMA-GARCH in crypto markets",
  },
  summary: {
    de: "Vergleich von ARIMA-GARCH über BTC, ETH, DOGE und SOL: begrenzte Kurzfrist-Return-Predictability, aber robuste Ergebnisse für Volatilitäts- und 5%-VaR-Risikoanalysen.",
    en: "ARIMA-GARCH comparison across BTC, ETH, DOGE, and SOL: limited short-term return predictability, but robust volatility and 5% VaR risk-estimation outcomes.",
  },
  pdfPath: "/thesis.pdf",
  notebookPath: "/notebook.html",
});

const experience = z.array(experienceItemSchema).parse([
  {
    role: {
      de: "Product Owner Financing & AI Taskforce",
      en: "Product owner financing & AI taskforce",
    },
    org: "Swiss Life Select Austria · Vienna / Hybrid",
    period: "07/2025–present",
    outcomes: {
      de: [
        "Strategische Initiativen direkt mit dem Head of Sales geplant und priorisiert.",
        "Als Product Owner die Financing-Squad zwischen Beratung, Business und IT ausgerichtet.",
        "Sales- und Finanzierungsdaten analysiert und Forecasts für Management-Entscheidungen erstellt.",
        "In der internen AI-Taskforce erste Automations- und AI-Use-Cases für den Vertrieb aufgebaut.",
      ],
      en: [
        "Planned and prioritized strategic initiatives directly with the Head of Sales.",
        "As product owner, aligned the financing squad across advisory, business, and IT teams.",
        "Analyzed sales and financing data and delivered management-ready forecasts.",
        "Shaped first automation and AI use cases as part of the internal AI taskforce.",
      ],
    },
    domains: ["investment", "payments", "data", "ai"],
    tech: ["Python", "SQL", "Excel", "Forecasting", "Prompt Engineering"],
  },
  {
    role: {
      de: "Berater Immobilienfinanzierung",
      en: "Advisor mortgage financing",
    },
    org: "Swiss Life Select Austria · Graz / Hybrid",
    period: "05/2024–06/2025",
    outcomes: {
      de: [
        "Asset Manager und Privatkunden zu Hypothekenfinanzierungen beraten.",
        "Kredit- und Marktrisiken in der privaten Immobilienfinanzierung analysiert.",
        "Entscheidungsvorlagen mit Zinsprognosen und regulatorischen Rahmenbedingungen erstellt.",
      ],
      en: [
        "Advised asset managers and private clients on mortgage financing.",
        "Analyzed credit and market risks in private real-estate financing.",
        "Prepared decision templates based on rate forecasts and regulatory constraints.",
      ],
    },
    domains: ["investment", "risk", "payments"],
    tech: [
      "Risk Analysis",
      "Interest-Rate Scenarios",
      "Regulatory Framing",
      "Excel",
    ],
  },
  {
    role: {
      de: "MSc Business Administration (Major Finance)",
      en: "MSc business administration (major finance)",
    },
    org: "University of Graz",
    period: "10/2023–10/2025",
    outcomes: {
      de: [
        "Masterstudium BWL (Major Finance) mit 126 ECTS und gewichteter Abschlussnote 1,962 abgeschlossen.",
        "Schwerpunkte aus Transcript: Business Intelligence, Data-Driven Decision Support, Data Management, Corporate Finance und Investments.",
        "Masterarbeit zu ARIMA-GARCH für BTC, ETH, DOGE und SOL als reproduzierbares Multi-Horizon-/Rolling-Backtest-Setup umgesetzt.",
      ],
      en: [
        "Completed the MSc in business administration (major finance) with 126 ECTS and a weighted final grade of 1.962.",
        "Transcript focus areas include business intelligence, data-driven decision support, data management, corporate finance, and investments.",
        "Delivered a master’s thesis on ARIMA-GARCH for BTC, ETH, DOGE, and SOL with a reproducible multi-horizon and rolling-backtest setup.",
      ],
    },
    domains: ["investment", "risk", "data", "ai"],
    tech: [
      "Business Analytics",
      "Decision Support",
      "Corporate Finance",
      "Investments",
      "Econometrics",
    ],
  },
  {
    role: {
      de: "BSc Innovationsmanagement (berufsbegleitend)",
      en: "BSc innovation management (part-time)",
    },
    org: "FH CAMPUS 02 · Graz",
    period: "2021–2023",
    outcomes: {
      de: [
        "Bachelorabschluss mit 180 ECTS (Zeugnisdatum 11.07.2023) im berufsbegleitenden Innovationsmanagement.",
        "Abgedeckte Felder aus dem Abschlusszeugnis: Systems Engineering, Produktdesign, Prozessgestaltung, Qualitätsmanagement, Marktforschung und Statistik.",
        "Bachelorarbeiten zu LHC-Verbesserungspotenzialen sowie Lab-on-a-Chip Produktentwicklung durchgeführt.",
      ],
      en: [
        "Completed the part-time BSc in innovation management with 180 ECTS (certificate date: July 11, 2023).",
        "Covered systems engineering, product design, process design, quality management, market research, and statistics.",
        "Delivered bachelor thesis work on LHC improvement potential and lab-on-a-chip product-development requirements.",
      ],
    },
    domains: ["data", "infra", "other"],
    tech: [
      "Systems Engineering",
      "Product Development",
      "Quality Management",
      "Market Research",
      "Technical English",
    ],
  },
  {
    role: { de: "Netzwerk- und Eventmanager", en: "Network and event manager" },
    org: "Verein Netzwerk Logistik · Kapfenberg",
    period: "02/2023–10/2023",
    outcomes: {
      de: [
        "Branchenübergreifendes Unternehmensnetzwerk aufgebaut und betreut.",
        "Workshops und Events inklusive Budget und Durchführung verantwortet.",
        "Stakeholder aus Wirtschaft und Partnerorganisationen operativ koordiniert.",
      ],
      en: [
        "Built and maintained a cross-industry corporate network.",
        "Owned workshop and event planning, budgeting, and execution.",
        "Coordinated stakeholders across companies and partner organizations.",
      ],
    },
    domains: ["other"],
    tech: ["Stakeholder Management", "Event Budgeting", "Facilitation"],
  },
  {
    role: {
      de: "Qualitäts- und Prozessmanagement",
      en: "Quality and process management",
    },
    org: "Hanfama Pflanzen Produktions GmbH · Graz",
    period: "09/2020–01/2023",
    outcomes: {
      de: [
        "QM-System optimiert und weiterentwickelt.",
        "Schnittstellen zwischen Einkauf, Vertrieb, Produktion und Management koordiniert.",
        "Prozessverbesserungen mit klarer Verantwortungsstruktur umgesetzt.",
      ],
      en: [
        "Optimized and expanded the quality-management system.",
        "Managed interfaces across purchasing, sales, production, and management.",
        "Implemented process improvements with clear ownership.",
      ],
    },
    domains: ["other", "infra"],
    tech: ["Quality Management", "Process Optimization", "Operations"],
  },
  {
    role: { de: "Operations Lead", en: "Operations lead" },
    org: "Propeller Schuberthof · Graz",
    period: "09/2018–10/2019",
    outcomes: {
      de: [
        "Operative Teams mit über 50 Mitarbeitenden geführt.",
        "Abläufe für Stabilität, Output und Qualität strukturiert.",
        "Verantwortung für Personal- und Schichtplanung in dynamischem Umfeld übernommen.",
      ],
      en: [
        "Led operations teams of more than 50 employees.",
        "Structured workflows for stability, output, and quality.",
        "Owned staffing and shift planning in a dynamic environment.",
      ],
    },
    domains: ["other", "infra"],
    tech: ["Team Leadership", "Operations Planning", "Execution Management"],
  },
]);

const siteSettings = siteSettingsSchema.parse({
  bookCallUrl:
    "mailto:markus.oeffel@gmail.com?subject=Project%20inquiry%20-%20Markus%20Oeffel",
  cvUrl: "https://fintech-wow.dev/cv.pdf",
  socialLinks: [
    { label: "Email", url: "mailto:markus.oeffel@gmail.com" },
    { label: "Contact", url: "https://fintech-wow.dev/en/contact" },
  ],
  heroKpis: [
    { label: { de: "Assets", en: "Assets" }, value: "4" },
    { label: { de: "Horizonte", en: "Horizons" }, value: "1/3/7/14/30d" },
    { label: { de: "Risk-Level", en: "Risk level" }, value: "5% VaR" },
  ],
});

const skillCategories = z.array(skillCategorySchema).parse([
  {
    title: { de: "Statistik & Ökonometrie", en: "Statistics & Econometrics" },
    items: [
      {
        name: "Applied Business Analytics",
        note: {
          de: "Business Intelligence, Case Studies Business Analytics, Data-Driven Decision Support",
          en: "Business intelligence, business analytics case studies, data-driven decision support",
        },
      },
      {
        name: "Time Series Modeling",
        note: {
          de: "ARIMA/ARMA, Stationaritätstests (ADF/KPSS), Diagnostik",
          en: "ARIMA/ARMA, stationarity tests (ADF/KPSS), diagnostics",
        },
      },
      {
        name: "Volatility Modeling",
        note: {
          de: "GARCH, GJR-GARCH, FIGARCH, VaR-Backtesting",
          en: "GARCH, GJR-GARCH, FIGARCH, VaR backtesting",
        },
      },
      {
        name: "Forecast Evaluation",
        note: {
          de: "MAPE, QLIKE, Diebold-Mariano, Kupiec/Christoffersen",
          en: "MAPE, QLIKE, Diebold-Mariano, Kupiec/Christoffersen",
        },
      },
      {
        name: "Monte Carlo",
        note: {
          de: "Szenario-Simulation für Risiko- und Entscheidungsräume",
          en: "Scenario simulation for risk and decision spaces",
        },
      },
      {
        name: "Business Math & Statistics",
        note: {
          de: "Masterkurs Wirtschaftsmathematik und Statistik (Uni Graz)",
          en: "Master coursework in business mathematics and statistics (University of Graz)",
        },
      },
    ],
  },
  {
    title: { de: "Finance & Risk", en: "Finance & Risk" },
    items: [
      {
        name: "Corporate Finance",
        note: {
          de: "DCF (WACC/APV), Multiples (EV/EBITDA, P/E)",
          en: "DCF (WACC/APV), multiples (EV/EBITDA, P/E)",
        },
      },
      {
        name: "Mortgage & Credit Risk",
        note: {
          de: "Zins-Szenarien, Kreditprüfung, Entscheidungsunterlagen",
          en: "Rate scenarios, credit-risk analysis, decision templates",
        },
      },
      {
        name: "Market Analytics",
        note: {
          de: "Kapitalmärkte, Krypto-Volatilität, makroökonomischer Kontext",
          en: "Capital markets, crypto volatility, macro context",
        },
      },
      {
        name: "Academic Finance Track",
        note: {
          de: "Finance Management, Financial Market Analysis, Investment Analysis, Corporate-Finance-Seminare",
          en: "Finance management, financial market analysis, investment analysis, and corporate-finance seminars",
        },
      },
      {
        name: "Risk Communication",
        note: {
          de: "Management-Reporting und klare Entscheidungskommunikation",
          en: "Management reporting and clear decision communication",
        },
      },
      {
        name: "CFA Level I Candidate",
        note: {
          de: "Prüfung geplant für August 2026",
          en: "Exam planned for August 2026",
        },
      },
    ],
  },
  {
    title: { de: "Data & AI Delivery", en: "Data & AI Delivery" },
    items: [
      {
        name: "Python Stack",
        note: {
          de: "pandas, numpy, statsmodels, arch, yfinance",
          en: "pandas, numpy, statsmodels, arch, yfinance",
        },
      },
      {
        name: "SQL & Reporting",
        note: {
          de: "Auswertungen, Forecast-Packs und Management-Dashboards",
          en: "Analytics packs, forecasts, and management dashboards",
        },
      },
      {
        name: "AI Prototyping",
        note: {
          de: "Prompt Engineering, Google AI Studio, Automations-Ideen",
          en: "Prompt engineering, Google AI Studio, automation concepts",
        },
      },
      {
        name: "Stakeholder Alignment",
        note: {
          de: "Business, Beratung und IT in einem Delivery-Loop verbinden",
          en: "Align business, advisory, and IT in one delivery loop",
        },
      },
      {
        name: "Engineering Fundamentals",
        note: {
          de: "Systems Engineering, Prozessgestaltung, Qualitätsmanagement, Softwareentwicklung (FH CAMPUS 02)",
          en: "Systems engineering, process design, quality management, and software development (FH CAMPUS 02)",
        },
      },
    ],
  },
  {
    title: { de: "Abschlüsse & Studienfokus", en: "Degrees & Academic Focus" },
    items: [
      {
        name: "MSc Business Administration (Major Finance)",
        note: {
          de: "Universität Graz · Abschluss 06.10.2025 · 126 ECTS · gewichtete Note 1,962",
          en: "University of Graz · graduated October 6, 2025 · 126 ECTS · weighted grade 1.962",
        },
      },
      {
        name: "BSc Innovationsmanagement (berufsbegleitend)",
        note: {
          de: "FH CAMPUS 02 · Abschluss 11.07.2023 · 180 ECTS",
          en: "FH CAMPUS 02 · graduated July 11, 2023 · 180 ECTS",
        },
      },
      {
        name: "Bachelor Thesis Topics",
        note: {
          de: "LHC-Teilchenbeschleuniger (Verbesserungspotenziale) und smartphonebasierte Lab-on-a-Chip Produktentwicklung",
          en: "LHC accelerator improvement potential and smartphone-based lab-on-a-chip product-development analysis",
        },
      },
      {
        name: "Applied Study Mix",
        note: {
          de: "Kombination aus Wirtschaft, Technik, Berufspraktika und wissenschaftlicher Dokumentation",
          en: "Blend of business, engineering, internships, and scientific documentation",
        },
      },
    ],
  },
  {
    title: { de: "Zertifizierungen", en: "Certifications" },
    items: [
      {
        name: "Udemy AI Engineer Core Track",
        note: {
          de: "LLM Engineering, RAG, QLoRA, Agents · 33,5h · abgeschlossen am 11. Januar 2026",
          en: "LLM engineering, RAG, QLoRA, agents · 33.5h · completed on January 11, 2026",
        },
      },
      {
        name: "Google Advanced Data Analytics",
        note: {
          de: "Coursera Professional Certificate (7 Kurse) · abgeschlossen am 14. Februar 2025",
          en: "Coursera professional certificate (7 courses) · completed on February 14, 2025",
        },
      },
      {
        name: "DataCamp Data Analyst in Python",
        note: {
          de: "36 Stunden · abgeschlossen am 22. Februar 2025",
          en: "36 hours · completed on February 22, 2025",
        },
      },
      {
        name: "DataCamp Python Data Fundamentals",
        note: {
          de: "28 Stunden · abgeschlossen am 7. Februar 2025",
          en: "28 hours · completed on February 7, 2025",
        },
      },
      {
        name: "Value Management Module 1",
        note: {
          de: "EN 12 973 · Oktober–November 2021",
          en: "EN 12 973 · October–November 2021",
        },
      },
      {
        name: "Value Management Module 2",
        note: {
          de: "EN 12 973 · November 2021–Januar 2022",
          en: "EN 12 973 · November 2021–January 2022",
        },
      },
      {
        name: "Claude Code Training",
        note: {
          de: "Agentic Coding Workflows, Terminal-Automation und iterative Delivery",
          en: "Agentic coding workflows, terminal automation, and iterative delivery",
        },
      },
      {
        name: "Seminar Track",
        note: {
          de: "Leadership, Supply Chain Management, Projektmanagement, Präsentation & Rhetorik",
          en: "Leadership, supply chain management, project management, presentation & rhetoric",
        },
      },
    ],
  },
  {
    title: { de: "Tools & Kommunikation", en: "Tools & Communication" },
    items: [
      {
        name: "Tooling",
        note: {
          de: "Python, R, SQL, Excel, Jupyter",
          en: "Python, R, SQL, Excel, Jupyter",
        },
      },
      {
        name: "Languages",
        note: {
          de: "Deutsch (C2), Englisch (C1), Französisch (A2)",
          en: "German (C2), English (C1), French (A2)",
        },
      },
      {
        name: "Presenting & Workshops",
        note: {
          de: "Rhetorik, Stakeholder-Workshops, strukturierte Vermittlung",
          en: "Rhetoric, stakeholder workshops, structured communication",
        },
      },
    ],
  },
]);

const howIWork = z.array(howIWorkPrincipleSchema).parse([
  {
    title: { de: "Model before hype", en: "Model before hype" },
    body: {
      de: "Ich bevorzuge klare, prüfbare Modelle und erkläre Annahmen, bevor ich große Behauptungen mache.",
      en: "I prefer clear, testable models and explicit assumptions before making big claims.",
    },
  },
  {
    title: { de: "Risk-aware delivery", en: "Risk-aware delivery" },
    body: {
      de: "Ich kombiniere Produkttempo mit Risiko- und Compliance-Blick, damit Entscheidungen belastbar bleiben.",
      en: "I combine delivery speed with risk and compliance awareness so decisions remain reliable.",
    },
  },
  {
    title: { de: "Reproducibility first", en: "Reproducibility first" },
    body: {
      de: "Pipelines, Auswertungen und Modelle müssen reproduzierbar sein – sonst sind sie nicht entscheidungsfähig.",
      en: "Pipelines, analyses, and models must be reproducible, otherwise they are not decision-ready.",
    },
  },
  {
    title: { de: "Business translation", en: "Business translation" },
    body: {
      de: "Ich übersetze analytische Ergebnisse in klare Optionen für Management, Vertrieb und operative Teams.",
      en: "I translate analytical results into clear options for management, sales, and operational teams.",
    },
  },
]);

export const CASE_STUDIES: readonly CaseStudy[] = caseStudies;
export const THESIS: Thesis = thesis;
export const EXPERIENCE: readonly ExperienceItem[] = experience;
export const SITE_SETTINGS: SiteSettings = siteSettings;
export const SKILL_CATEGORIES: readonly SkillCategory[] = skillCategories;
export const HOW_I_WORK: readonly HowIWorkPrinciple[] = howIWork;

export function getCaseStudies(options?: {
  publishedOnly?: boolean;
}): readonly CaseStudy[] {
  const publishedOnly = options?.publishedOnly ?? true;
  return CASE_STUDIES.filter((c) => (publishedOnly ? c.published : true));
}

export function getCaseStudyBySlug(slug: string): CaseStudy | null {
  return CASE_STUDIES.find((c) => c.slug === slug) ?? null;
}

export function getCaseStudyTitle(caseStudy: CaseStudy, lang: Language): string {
  return caseStudy.title[lang];
}

export function getSiteSettings(): SiteSettings {
  return SITE_SETTINGS;
}

export function getSkillCategories(): readonly SkillCategory[] {
  return SKILL_CATEGORIES;
}

export function getHowIWorkPrinciples(): readonly HowIWorkPrinciple[] {
  return HOW_I_WORK;
}
