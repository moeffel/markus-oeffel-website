#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const modeArg = (process.argv[2] ?? "soft").toLowerCase();
const mode = modeArg === "public" ? "public" : "soft";

const repoRoot = process.cwd();

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    entries[key] = value;
  }
  return entries;
}

function loadEnv() {
  const fromFiles = {
    ...parseEnvFile(path.join(repoRoot, ".env")),
    ...parseEnvFile(path.join(repoRoot, ".env.local")),
  };
  return { ...fromFiles, ...process.env };
}

function resolveValue(env, key) {
  const value = env[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function isTruthy(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(normalized);
}

function safeRead(relPath) {
  const absolute = path.join(repoRoot, relPath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

function hasGitCommits() {
  try {
    const count = execSync("git rev-list --count HEAD", {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return Number(count) > 0;
  } catch {
    return false;
  }
}

function isGitClean() {
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return status.length === 0;
  } catch {
    return false;
  }
}

const env = loadEnv();
const findings = [];

function addCheck(input) {
  findings.push(input);
}

function containsAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function checkRequiredEnv() {
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "WEBHOOK_HMAC_SECRET",
    "DRAFT_MODE_SECRET",
  ];

  for (const key of required) {
    addCheck({
      id: `env:${key}`,
      phase: "soft",
      severity: "critical",
      ok: Boolean(resolveValue(env, key)),
      message: `${key} gesetzt`,
      action: `Setze ${key} in Deployment-Secrets/Env.`,
    });
  }

  const contactToKeys = ["CONTACT_TO_EMAIL", "RESEND_TO_EMAIL", "SMTP_TO_EMAIL"];
  const hasContactTo = contactToKeys.some((key) => Boolean(resolveValue(env, key)));
  addCheck({
    id: "env:contact-to",
    phase: "soft",
    severity: "critical",
    ok: hasContactTo,
    message: "Contact-Zieladresse gesetzt (CONTACT_TO_EMAIL / RESEND_TO_EMAIL / SMTP_TO_EMAIL)",
    action:
      "Setze CONTACT_TO_EMAIL (oder RESEND_TO_EMAIL/SMTP_TO_EMAIL) auf die Inbox für Kontaktanfragen.",
  });

  const contactFrom = resolveValue(env, "CONTACT_FROM_EMAIL");
  const resendFrom = resolveValue(env, "RESEND_FROM_EMAIL");
  const smtpFrom = resolveValue(env, "SMTP_FROM_EMAIL");
  const smtpUser = resolveValue(env, "SMTP_USER");
  const smtpHost = resolveValue(env, "SMTP_HOST");
  const resendApiKey = resolveValue(env, "RESEND_API_KEY");
  const resendFallbackRaw = resolveValue(
    env,
    "CONTACT_ALLOW_RESEND_ONBOARDING_FROM",
  );
  const allowResendOnboardingFallback =
    resendFallbackRaw === null ? true : isTruthy(resendFallbackRaw);

  const resendReady = Boolean(
    resendApiKey && (contactFrom || resendFrom || allowResendOnboardingFallback),
  );
  const smtpReady = Boolean(smtpHost && (smtpFrom || contactFrom || resendFrom || smtpUser));

  addCheck({
    id: "env:contact-provider-ready",
    phase: "soft",
    severity: "critical",
    ok: resendReady || smtpReady,
    message: "Mindestens ein Contact-Provider vollständig konfiguriert",
    action:
      "Resend: RESEND_API_KEY + CONTACT_FROM_EMAIL/RESEND_FROM_EMAIL. SMTP: SMTP_HOST + SMTP_FROM_EMAIL/SMTP_USER.",
  });

  addCheck({
    id: "env:contact-from-explicit",
    phase: "soft",
    severity: "recommended",
    ok: Boolean(contactFrom || resendFrom || smtpFrom),
    message: "Expliziter Absender gesetzt",
    action:
      "Setze CONTACT_FROM_EMAIL (oder RESEND_FROM_EMAIL/SMTP_FROM_EMAIL), um onboarding@resend.dev-Fallback zu vermeiden.",
  });

  const contactProvider = (resolveValue(env, "CONTACT_PROVIDER") ?? "auto").toLowerCase();
  addCheck({
    id: "env:contact-provider-mode",
    phase: "soft",
    severity: "recommended",
    ok: ["auto", "resend", "smtp"].includes(contactProvider),
    message: "CONTACT_PROVIDER ist gültig (auto/resend/smtp)",
    action: "Setze CONTACT_PROVIDER auf auto, resend oder smtp.",
  });

  const siteUrl = resolveValue(env, "NEXT_PUBLIC_SITE_URL");
  const isLocalhost =
    siteUrl &&
    /localhost|127\.0\.0\.1/i.test(siteUrl);
  addCheck({
    id: "env:site-url-production-like",
    phase: "soft",
    severity: "critical",
    ok: Boolean(siteUrl) && !isLocalhost,
    message: "NEXT_PUBLIC_SITE_URL zeigt auf echte Domain",
    action: "Setze NEXT_PUBLIC_SITE_URL auf Staging/Production-Domain (nicht localhost).",
  });

  const siteKey = resolveValue(env, "NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const secretKey = resolveValue(env, "TURNSTILE_SECRET_KEY");
  addCheck({
    id: "env:turnstile-pair",
    phase: "soft",
    severity: "recommended",
    ok: (!siteKey && !secretKey) || (Boolean(siteKey) && Boolean(secretKey)),
    message: "Turnstile Keys konsistent (beide gesetzt oder beide leer)",
    action: "Für Captcha-Hardening beide Turnstile Keys setzen.",
  });

  const ragReady = Boolean(
    resolveValue(env, "OPENAI_API_KEY") &&
      (resolveValue(env, "SUPABASE_DB_URL") || resolveValue(env, "DATABASE_URL")),
  );
  addCheck({
    id: "env:rag-ready",
    phase: "soft",
    severity: "recommended",
    ok: ragReady,
    message: "RAG-Infra für /api/ask produktiv verfügbar",
    action: "Optional für Soft-Launch; für volle AI-Funktion OPENAI_API_KEY + DB URL setzen.",
  });

  addCheck({
    id: "env:plausible",
    phase: "soft",
    severity: "recommended",
    ok: Boolean(resolveValue(env, "NEXT_PUBLIC_PLAUSIBLE_SRC")),
    message: "Plausible Analytics konfiguriert",
    action: "Optional, aber für Monitoring empfehlenswert: NEXT_PUBLIC_PLAUSIBLE_SRC setzen.",
  });
}

function checkRepoState() {
  addCheck({
    id: "git:has-commits",
    phase: "soft",
    severity: "critical",
    ok: hasGitCommits(),
    message: "Git-Historie vorhanden",
    action: "Vor Deploy mindestens einen Basis-Commit erstellen.",
  });

  addCheck({
    id: "git:clean-tree",
    phase: "soft",
    severity: "critical",
    ok: isGitClean(),
    message: "Working tree ist sauber",
    action: "Vor Deploy Änderungen committen (Rollback/Traceability).",
  });
}

function checkPlaceholderContent() {
  const dataTs = safeRead("src/lib/content/data.ts");
  addCheck({
    id: "content:example-links",
    phase: "soft",
    severity: "critical",
    ok: !containsAny(dataTs, ["https://example.com", "calendly.com/example"]),
    message: "Keine Placeholder-Links in Content-Daten",
    action: "Case links, CV und Book-call URL auf echte Ziele umstellen.",
  });

  const imprintEn = safeRead("src/app/[lang]/imprint/page.tsx");
  const imprintDe = safeRead("src/app/[lang]/impressum/page.tsx");
  const privacyEn = safeRead("src/app/[lang]/privacy/page.tsx");
  const privacyDe = safeRead("src/app/[lang]/datenschutz/page.tsx");
  const legalCombined = [imprintEn, imprintDe, privacyEn, privacyDe].join("\n");

  addCheck({
    id: "legal:final-operator-data",
    phase: "public",
    severity: "critical",
    ok: !containsAny(legalCombined, [
      "To be completed before production go-live",
      "Vor Launch mit ladungsfähiger Anschrift ergänzen",
      "initial legal draft",
      "initialer Rechtstext",
    ]),
    message: "Imprint/Impressum enthalten finale Betreiberdaten",
    action: "Name, ladungsfähige Anschrift, finale Kontaktadresse und finalen Rechtstext eintragen.",
  });
}

function checkIndexingGuard() {
  const indexingEnabled = isTruthy(resolveValue(env, "ENABLE_PUBLIC_INDEXING"));
  const robots = safeRead("src/app/robots.ts");
  const sitemap = safeRead("src/app/sitemap.ts");

  addCheck({
    id: "seo:indexing-switch-wired",
    phase: "soft",
    severity: "recommended",
    ok:
      robots.includes("isPublicIndexingEnabled") &&
      sitemap.includes("isPublicIndexingEnabled"),
    message: "Robots/Sitemap sind an ENABLE_PUBLIC_INDEXING gekoppelt",
    action:
      "robots.ts und sitemap.ts auf isPublicIndexingEnabled()-Schalter mappen.",
  });

  addCheck({
    id: "seo:staging-default-noindex",
    phase: "soft",
    severity: "recommended",
    ok: !indexingEnabled,
    message: "Staging-Default ist noindex",
    action:
      "In Staging ENABLE_PUBLIC_INDEXING leer lassen oder explizit false setzen.",
  });

  addCheck({
    id: "seo:public-indexing-enabled",
    phase: "public",
    severity: "critical",
    ok: indexingEnabled,
    message: "Public-Indexing explizit aktiviert",
    action:
      "Für Public-Launch ENABLE_PUBLIC_INDEXING=true setzen und neu deployen.",
  });
}

checkRequiredEnv();
checkRepoState();
checkPlaceholderContent();
checkIndexingGuard();

const isCriticalFailure = findings.some((item) => {
  if (item.ok) return false;
  if (item.phase === "public" && mode !== "public") return false;
  return item.severity === "critical";
});

const relevant = findings.filter((item) => mode === "public" || item.phase !== "public");
const okCount = relevant.filter((item) => item.ok).length;
const failCount = relevant.length - okCount;

console.log(`Deploy readiness (${mode})`);
console.log("-".repeat(32));

for (const item of relevant) {
  const icon = item.ok ? "✅" : item.severity === "critical" ? "❌" : "⚠️";
  console.log(`${icon} ${item.message}`);
  if (!item.ok) {
    console.log(`   → ${item.action}`);
  }
}

console.log("-".repeat(32));
console.log(`Checks: ${relevant.length}, ok: ${okCount}, offen: ${failCount}`);

if (isCriticalFailure) {
  process.exitCode = 1;
}
