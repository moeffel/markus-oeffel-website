#!/usr/bin/env node
/* eslint-disable no-console */

const target =
  process.argv[2] ??
  process.env.TARGET_URL ??
  "http://localhost:3000";

function normalizeBaseUrl(input) {
  return input.replace(/\/+$/, "");
}

function toAbsoluteUrl(pathname) {
  return `${normalizeBaseUrl(target)}${pathname}`;
}

function isPublicIndexingEnabled() {
  const raw = process.env.ENABLE_PUBLIC_INDEXING;
  if (!raw) return false;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function ensureIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Missing "${needle}" in ${label}`);
  }
}

async function fetchText(pathname) {
  const url = toAbsoluteUrl(pathname);
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text().catch(() => "");
  return { res, text, url };
}

function expectOkStatus(status, label) {
  if (status < 200 || status >= 300) {
    throw new Error(`Expected 2xx for ${label}, got ${status}`);
  }
}

async function checkCorePages() {
  const checks = [
    {
      journey: "J1",
      path: "/en",
      mustContain: ['href="/en/projects"', 'href="/en/contact"', "Markus Öffel"],
    },
    {
      journey: "J1",
      path: "/en/projects",
      mustContain: ["Projects", "open_case_study"],
    },
    {
      journey: "J1",
      path: "/en/projects/markus-oeffel-website",
      mustContain: ["Markus Öffel's Website", "Context", "Problem", "Impact"],
    },
    {
      journey: "J2",
      path: "/en/contact",
      mustContain: ["Contact", "Send a short note."],
    },
    {
      journey: "J3",
      path: "/de",
      mustContain: ['href="/en"', "Markus Öffel"],
    },
    {
      journey: "J3",
      path: "/de/projects",
      mustContain: ["Projekte"],
    },
    {
      journey: "J4",
      path: "/en/ask",
      mustContain: ["Ask my work", "citations"],
    },
  ];

  for (const check of checks) {
    const { res, text, url } = await fetchText(check.path);
    expectOkStatus(res.status, url);
    for (const token of check.mustContain) {
      ensureIncludes(text, token, `${check.path} (${check.journey})`);
    }
    console.log(`[ok] ${check.journey} ${check.path}`);
  }
}

async function checkLegalPages() {
  const legalPaths = ["/en/imprint", "/en/privacy", "/de/impressum", "/de/datenschutz"];
  for (const path of legalPaths) {
    const { res, url } = await fetchText(path);
    expectOkStatus(res.status, url);
    console.log(`[ok] legal ${path}`);
  }
}

async function checkPrivateCorpusNotPublic() {
  const { res, url } = await fetchText("/private_corpus/high_profile_cv.md");
  if (res.status === 200) {
    throw new Error(`Private corpus file must not be public: ${url}`);
  }
  console.log(`[ok] private corpus not public (${res.status})`);
}

async function checkSitemap() {
  const { res, text, url } = await fetchText("/sitemap.xml");
  expectOkStatus(res.status, url);

  if (isPublicIndexingEnabled()) {
    ensureIncludes(text, "/en/projects", "sitemap");
    ensureIncludes(text, "/de/projects", "sitemap");
    ensureIncludes(text, "/en/ask", "sitemap");
  } else {
    if (
      text.includes("/en/projects") ||
      text.includes("/de/projects") ||
      text.includes("/en/ask")
    ) {
      throw new Error("Sitemap should be empty in noindex mode.");
    }
  }

  if (text.includes("private_corpus") || text.includes("high_profile_cv")) {
    throw new Error("Sitemap must not expose private corpus.");
  }
  console.log("[ok] sitemap checks");
}

async function main() {
  const failures = [];
  const tasks = [
    { name: "core pages", fn: checkCorePages },
    { name: "legal pages", fn: checkLegalPages },
    { name: "private corpus", fn: checkPrivateCorpusNotPublic },
    { name: "sitemap", fn: checkSitemap },
  ];

  for (const task of tasks) {
    try {
      await task.fn();
    } catch (err) {
      failures.push({ name: task.name, err });
      console.error(
        `[fail] ${task.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

await main();
