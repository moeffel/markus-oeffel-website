#!/usr/bin/env node
/* eslint-disable no-console */

const target =
  process.argv[2] ??
  process.env.TARGET_URL ??
  "http://localhost:3000";

const expectCsp = process.env.EXPECT_CSP === "1";
const expectHsts = process.env.EXPECT_HSTS === "1";

const paths = (process.env.PATHS ?? "/en,/de")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

function requireHeader(res, name) {
  const v = res.headers.get(name);
  if (!v) {
    throw new Error(`Missing header: ${name}`);
  }
  return v;
}

async function checkPath(pathname) {
  const url = new URL(pathname, target);
  const res = await fetch(url, { redirect: "manual" });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    throw new Error(`Unexpected redirect (${res.status}) to ${location ?? "?"}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url.toString()} (${text.slice(0, 200)})`);
  }

  requireHeader(res, "X-Content-Type-Options");
  requireHeader(res, "X-Frame-Options");
  requireHeader(res, "Referrer-Policy");
  requireHeader(res, "Permissions-Policy");

  if (expectHsts) {
    requireHeader(res, "Strict-Transport-Security");
  }

  if (expectCsp) {
    const csp = requireHeader(res, "Content-Security-Policy");
    if (!csp.includes("nonce-")) {
      throw new Error("CSP present, but missing nonce");
    }
  }
}

async function main() {
  const failures = [];

  for (const p of paths) {
    try {
      await checkPath(p);
      console.log(`[ok] ${p}`);
    } catch (err) {
      failures.push({ path: p, err });
      console.error(`[fail] ${p} - ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (failures.length) {
    process.exit(1);
  }
}

await main();

