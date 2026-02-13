import type { Language } from "@/lib/i18n";

export type LegalInfoItem = {
  label: string;
  value: string;
};

export type LegalSection = {
  title: string;
  description?: string;
  paragraphs?: readonly string[];
  listItems?: readonly string[];
  infoItems?: readonly LegalInfoItem[];
};

type LandingFocusArea = {
  title: string;
  note: string;
};

export const LANDING_COPY: Record<
  Language,
  {
    headline: string;
    sub: string;
    proofChips: readonly string[];
    trustPoints: readonly string[];
    aboutEyebrow: string;
    aboutTitle: string;
    aboutSubtitle: string;
    aboutParagraphs: readonly string[];
    aboutHighlights: readonly string[];
    askTitle: string;
    askSubtitle: string;
    askExamplePrompts: readonly string[];
    ragTitle: string;
    ragSteps: readonly string[];
    ragGuardrails: readonly string[];
    focusTitle: string;
    focusAreas: readonly LandingFocusArea[];
  }
> = {
  de: {
    headline: "Hi, ich bin Markus Öffel.",
    sub: "Ich arbeite an Finance-, Data- und AI-Produkten an der Schnittstelle von Tech, Quant und Umsetzung.",
    proofChips: [
      "MSc Finance",
      "BSc Innovationsmanagement",
      "Google Advanced Data Analytics (Coursera)",
      "CFA Level I · August 2026",
    ],
    trustPoints: [
      "Methodisch arbeiten: erst Hypothesen, Datenqualität und klare Modellannahmen.",
      "Messbar liefern: reproduzierbare Auswertungen statt Buzzword-Roadmaps.",
      "AI mit Belegen: RAG + Citations statt Halluzinationen.",
      "Praxisbezug: Theorie, Zertifikate und reale Umsetzung in einem Portfolio verbunden.",
    ],
    aboutEyebrow: "Über mich",
    aboutTitle: "Finance-, Data- und AI-Builder mit Produktblick.",
    aboutSubtitle:
      "Von Zeitreihen- und Risikomodellen bis zu RAG-Assistenz: ich baue verständliche, belastbare Lösungen.",
    aboutParagraphs: [
      "Ich verbinde technische Umsetzung, quantitative Denkweise und Produktfokus zu einer klaren Delivery-Linie.",
      "Meine Arbeit startet bei belastbaren Daten- und Entscheidungsflüssen und endet erst bei nachvollziehbaren Ergebnissen im Betrieb.",
      "Gerade in FinTech zählen nicht nur neue Features, sondern Verlässlichkeit, Sicherheit und auditierbare Entscheidungen.",
    ],
    aboutHighlights: [
      "Tech: TypeScript/Next.js, APIs, Datenflüsse, QA- und Deploy-Checks.",
      "Quant: ARIMA/GARCH, Forecast-Evaluation und VaR-Backtesting.",
      "AI: RAG-gestützte Assistenten mit Quellen, Grenzen und Kostenkontrolle.",
    ],
    askTitle: "You can ask anything about me.",
    askSubtitle:
      "Stell Fragen zu Projekten, Thesis, Skills oder Arbeitsweise. Antworten werden über RAG aus den Website-Inhalten zusammengesetzt.",
    askExamplePrompts: [
      "Welche Methoden nutzt du in deiner ARIMA-GARCH-Masterarbeit?",
      "Welche Skills kommen aus deinen Zertifikaten?",
      "Wie würdest du ein AI-Feature produktionsnah aufsetzen?",
    ],
    ragTitle: "RAG in 3 Schritten",
    ragSteps: [
      "Frage analysieren und relevante Content-Abschnitte abrufen.",
      "Antwort aus belegten Quellen zusammenstellen.",
      "Ergebnis mit Citations und sinnvollen Next Steps ausgeben.",
    ],
    ragGuardrails: [
      "Antworten basieren auf den publizierten Seiteninhalten, nicht auf freier Spekulation.",
      "Relevante Aussagen kommen mit Quellenhinweis.",
      "Wenn Informationen fehlen, wird das transparent benannt.",
    ],
    focusTitle: "Core Focus",
    focusAreas: [
      {
        title: "Tech Engineering",
        note: "Next.js, TypeScript, APIs, observability, deployment quality.",
      },
      {
        title: "Quant & Analytics",
        note: "Zeitreihen, Volatilität, Backtesting, decision-ready metrics.",
      },
      {
        title: "AI Engineering",
        note: "RAG pipelines, citation-first answers, pragmatic LLM integration.",
      },
      {
        title: "Innovation Delivery",
        note: "Vom Konzept zur produktiven Lösung mit messbarem Impact.",
      },
    ],
  },
  en: {
    headline: "Hi, I’m Markus Öffel.",
    sub: "I work on finance, data, and AI products at the intersection of engineering, quant methods, and delivery.",
    proofChips: [
      "MSc Finance",
      "BSc Innovation Management",
      "Google Advanced Data Analytics (Coursera)",
      "CFA Level I · August 2026",
    ],
    trustPoints: [
      "Method-first execution: hypotheses, data quality, and explicit model assumptions.",
      "Measurable delivery: reproducible analysis over buzzword roadmaps.",
      "AI with evidence: RAG and citations over hallucinations.",
      "Practical profile: study track, certificates, and shipped implementation in one place.",
    ],
    aboutEyebrow: "About me",
    aboutTitle: "Finance, data, and AI builder with product depth.",
    aboutSubtitle:
      "From time-series and risk modeling to RAG assistants: I build systems that stay understandable and useful.",
    aboutParagraphs: [
      "I combine technical execution, quantitative thinking, and product pragmatism into one delivery lane.",
      "My work starts with reliable data and decision flows and ends with measurable outcomes in operations.",
      "In fintech, the goal is not only shipping features; it is shipping systems that remain trustworthy under pressure.",
    ],
    aboutHighlights: [
      "Tech: TypeScript/Next.js, APIs, data flows, QA and deployment checks.",
      "Quant: ARIMA/GARCH, forecast evaluation, and VaR backtesting.",
      "AI: RAG-based assistants with citations, boundaries, and cost discipline.",
    ],
    askTitle: "You can ask anything about me.",
    askSubtitle:
      "Ask about projects, thesis, skills, or how I work. Answers are composed via RAG from site content with citations.",
    askExamplePrompts: [
      "Which methods did you use in your ARIMA-GARCH thesis?",
      "Which skills come directly from your certificates?",
      "How would you move an AI feature toward production?",
    ],
    ragTitle: "RAG in 3 steps",
    ragSteps: [
      "Analyze the question and retrieve relevant content chunks.",
      "Compose the answer from evidence-backed sources.",
      "Return output with citations and actionable next steps.",
    ],
    ragGuardrails: [
      "Answers are grounded in published site content, not free-form speculation.",
      "Relevant claims are returned with source references.",
      "Missing context is explicitly called out instead of guessed.",
    ],
    focusTitle: "Core Focus",
    focusAreas: [
      {
        title: "Tech Engineering",
        note: "Next.js, TypeScript, APIs, observability, deployment quality.",
      },
      {
        title: "Quant & Analytics",
        note: "Time series, volatility, backtesting, decision-ready metrics.",
      },
      {
        title: "AI Engineering",
        note: "RAG pipelines, citation-first answers, pragmatic LLM integration.",
      },
      {
        title: "Innovation Delivery",
        note: "From concept to production with measurable impact.",
      },
    ],
  },
};

export const CONTACT_COPY: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    asideTitle: string;
    asideBody: string;
    responseLabel: string;
    responseValue: string;
    scopeLabel: string;
    scopeValue: string;
  }
> = {
  de: {
    eyebrow: "Start a project",
    title: "Kontakt",
    subtitle: "Schreib kurz, worum es geht.",
    asideTitle: "Prefer async?",
    asideBody:
      "Schick Kontext + Ziel + Deadline. Du bekommst einen klaren Plan als Antwort.",
    responseLabel: "Response",
    responseValue: "Innerhalb von 24h",
    scopeLabel: "Scope",
    scopeValue: "FinTech, Risk, AI, Data",
  },
  en: {
    eyebrow: "Start a project",
    title: "Contact",
    subtitle: "Send a short note.",
    asideTitle: "Prefer async?",
    asideBody: "Send context + goal + deadline. You’ll get a clear execution plan.",
    responseLabel: "Response",
    responseValue: "Within 24h",
    scopeLabel: "Scope",
    scopeValue: "FinTech, risk, AI, data",
  },
};

export const LEGAL_COPY = {
  privacy_en: {
    href: "/en/privacy",
    eyebrow: "Privacy baseline",
    title: "Privacy policy",
    subtitle:
      "Transparency notice for contact handling, security controls, and data retention in this portfolio setup.",
    chips: ["No profiling", "4 sections", "Updated 2026-02-11"],
    note: "If this setup changes, this policy is updated accordingly.",
    sections: [
      {
        title: "Controller",
        paragraphs: [
          "Controller: Markus Öffel (Markus Öffel's Website), Ausstellungsstraße 55, 1020 Vienna, Austria.",
          "Contact: markus.oeffel@gmail.com",
        ],
      },
      {
        title: "Data processing context",
        description:
          "This section describes what data is processed in the current setup.",
        listItems: [
          "Contact form submissions (name, email, message, optional company/intent).",
          "Operational request logs for stability and abuse prevention.",
          "No intentional profiling in the current implementation.",
        ],
      },
      {
        title: "Security controls",
        listItems: [
          "Input validation and request schema checks.",
          "Rate limiting to reduce abuse of forms and APIs.",
          "Optional captcha/turnstile checks in hardened mode.",
        ],
      },
      {
        title: "Retention and deletion",
        paragraphs: [
          "Contact and operational data are retained only as long as needed for support, security, and legal obligations.",
          "Delete or anonymize records when retention purpose no longer applies.",
        ],
      },
    ] as const satisfies readonly LegalSection[],
  },
  imprint_en: {
    href: "/en/imprint",
    eyebrow: "Legal Notice",
    title: "Imprint",
    subtitle: "Legal notice for Markus Öffel's Website.",
    chips: ["Owner-managed", "4 sections", "Updated 2026-02-11"],
    note:
      "This legal notice is provided for transparency of operator and contact details.",
    sections: [
      {
        title: "Provider",
        description: "Website operator details for legal contact and notices.",
        infoItems: [
          { label: "Name", value: "Markus Öffel (Markus Öffel's Website)" },
          {
            label: "Address",
            value: "Ausstellungsstraße 55, 1020 Vienna, Austria",
          },
        ],
      },
      {
        title: "Contact",
        description: "Primary legal and operational contact channel.",
        infoItems: [{ label: "Email", value: "markus.oeffel@gmail.com" }],
        paragraphs: [
          "For project inquiries, include context, objective, and timeline in your message.",
        ],
      },
      {
        title: "Content responsibility",
        paragraphs: [
          "The website content is created with care. No guarantee is provided for completeness, correctness, or uninterrupted availability.",
        ],
      },
      {
        title: "Liability for links",
        listItems: [
          "External links are reviewed when they are added.",
          "Permanent monitoring of linked third-party content is not feasible without concrete indications of legal issues.",
        ],
      },
    ] as const satisfies readonly LegalSection[],
  },
  impressum_de: {
    href: "/de/impressum",
    eyebrow: "Rechtliche Angaben",
    title: "Impressum",
    subtitle: "Rechtliche Anbieterangaben für Markus Öffel's Website.",
    chips: ["Inhabergeführt", "4 Abschnitte", "Stand 11.02.2026"],
    note:
      "Diese Seite dient der transparenten Anbieterkennzeichnung und Kontaktaufnahme.",
    sections: [
      {
        title: "Angaben gemäß § 5 TMG",
        description: "Basisdaten zum Anbieter für den aktuellen Projektstand.",
        infoItems: [
          { label: "Name", value: "Markus Öffel (Markus Öffel's Website)" },
          {
            label: "Anschrift",
            value: "Ausstellungsstraße 55, 1020 Wien, Österreich",
          },
        ],
      },
      {
        title: "Kontakt",
        infoItems: [{ label: "E-Mail", value: "markus.oeffel@gmail.com" }],
        paragraphs: [
          "Bei Projektanfragen bitte Kontext, Ziel und gewünschte Timeline angeben.",
        ],
      },
      {
        title: "Haftung für Inhalte",
        paragraphs: [
          "Die Inhalte dieser Website werden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität kann dennoch keine Gewähr übernommen werden.",
        ],
      },
      {
        title: "Haftung für Links",
        listItems: [
          "Externe Links werden bei Aufnahme geprüft.",
          "Eine permanente inhaltliche Kontrolle verlinkter Seiten ist ohne konkrete Hinweise auf Rechtsverletzungen nicht zumutbar.",
        ],
      },
    ] as const satisfies readonly LegalSection[],
  },
  datenschutz_de: {
    href: "/de/datenschutz",
    eyebrow: "Datenschutz-Basis",
    title: "Datenschutzerklärung",
    subtitle:
      "Transparenztext für Kontaktverarbeitung, Sicherheitsmaßnahmen und Aufbewahrung.",
    chips: ["Kein Profiling", "4 Abschnitte", "Stand 11.02.2026"],
    note:
      "Bei Änderungen am Verarbeitungsumfang wird diese Datenschutzerklärung angepasst.",
    sections: [
      {
        title: "Verantwortlicher",
        paragraphs: [
          "Verantwortlicher: Markus Öffel (Markus Öffel's Website), Ausstellungsstraße 55, 1020 Wien, Österreich.",
          "Kontakt: markus.oeffel@gmail.com",
        ],
      },
      {
        title: "Verarbeitungszwecke",
        description: "Welche Daten im aktuellen Stand verarbeitet werden.",
        listItems: [
          "Kontaktanfragen über das Formular (Name, E-Mail, Nachricht, optional Unternehmen/Anliegen).",
          "Technische Logs zur Stabilität und zum Missbrauchsschutz.",
          "Keine beabsichtigte personenbezogene Profilbildung.",
        ],
      },
      {
        title: "Sicherheitsmaßnahmen",
        listItems: [
          "Eingabevalidierung und API-Schema-Prüfungen.",
          "Rate Limiting für Formulare und API-Endpunkte.",
          "Optionale Captcha-/Turnstile-Prüfungen im Hardening.",
        ],
      },
      {
        title: "Speicherdauer und Löschung",
        paragraphs: [
          "Daten werden nur so lange gespeichert, wie es für Anfragebearbeitung, Sicherheit und gesetzliche Pflichten erforderlich ist.",
          "Nicht mehr erforderliche Datensätze werden gelöscht oder anonymisiert.",
        ],
      },
    ] as const satisfies readonly LegalSection[],
  },
} as const;
