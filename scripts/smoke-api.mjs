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

async function postJson(pathname, body) {
  const url = toAbsoluteUrl(pathname);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { res, json, url };
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function ensureErrorPayload(json) {
  ensure(Boolean(json && typeof json === "object"), "Expected JSON object error payload.");
  ensure(typeof json.error === "string", "Expected error payload to include string field 'error'.");
}

async function checkAskValidation() {
  const { res, json, url } = await postJson("/api/ask", { lang: "en" });
  ensure(res.status === 400, `Expected 400 validation error for ${url}, got ${res.status}`);
  ensureErrorPayload(json);
  ensure(json.error === "validation_error", `Expected validation_error, got ${json.error}`);
  console.log("[ok] /api/ask validation");
}

async function checkAskHappyPath() {
  const { res, json, url } = await postJson("/api/ask", {
    query: "Which methods did Markus use in the ARIMA-GARCH thesis?",
    lang: "en",
    session_id: "smoke-j4",
  });

  ensure(Boolean(json && typeof json === "object"), "Expected JSON object from /api/ask.");

  if (res.status === 400 && json.error === "captcha_required") {
    console.log("[ok] /api/ask guarded by captcha (captcha_required)");
    return;
  }

  if (res.status === 503 && json.error === "budget_exceeded") {
    console.log("[ok] /api/ask degraded mode (budget_exceeded)");
    return;
  }

  if (res.status === 500 && json.error === "provider_error") {
    console.log("[ok] /api/ask degraded mode (provider_error)");
    return;
  }

  ensure(res.status === 200, `Expected 200 for ${url}, got ${res.status}`);
  ensure(typeof json.answer === "string" && json.answer.trim().length > 0, "Missing ask answer.");
  ensure(Array.isArray(json.citations), "Expected citations array.");
  ensure(Array.isArray(json.suggested_links), "Expected suggested_links array.");

  if (json.citations.length > 0) {
    const c = json.citations[0];
    ensure(typeof c.doc_id === "string" && c.doc_id.length > 0, "Citation doc_id missing.");
    ensure(typeof c.title === "string" && c.title.length > 0, "Citation title missing.");
    ensure(
      typeof c.section_id === "string" && c.section_id.length > 0,
      "Citation section_id missing.",
    );
    ensure(typeof c.snippet === "string" && c.snippet.length > 0, "Citation snippet missing.");
  }

  if (json.suggested_links.length > 0) {
    const link = json.suggested_links[0];
    ensure(typeof link.label === "string" && link.label.length > 0, "Suggested link label missing.");
    ensure(typeof link.href === "string" && link.href.length > 0, "Suggested link href missing.");
  }

  console.log("[ok] /api/ask happy path");
}

async function checkContactValidation() {
  const { res, json, url } = await postJson("/api/contact", {});
  ensure(res.status === 400, `Expected 400 validation error for ${url}, got ${res.status}`);
  ensureErrorPayload(json);
  ensure(json.error === "validation_error", `Expected validation_error, got ${json.error}`);
  console.log("[ok] /api/contact validation");
}

async function checkContactContract() {
  const { res, json, url } = await postJson("/api/contact", {
    name: "Smoke Test",
    email: "smoke@example.com",
    message: "Contract check for contact API.",
    intent: "other",
  });

  const status = res.status;
  ensure(
    status === 200 || status === 500,
    `Expected 200 or 500 for ${url}, got ${status}`,
  );

  if (status === 200) {
    ensure(Boolean(json && typeof json === "object"), "Expected JSON object on success.");
    ensure(json.ok === true, "Expected { ok: true } on contact success.");
  } else {
    ensureErrorPayload(json);
    ensure(json.error === "provider_error", `Expected provider_error, got ${json.error}`);
  }

  console.log(`[ok] /api/contact contract (${status})`);
}

async function checkWebhookGuards() {
  const revalidate = await postJson("/api/revalidate", { type: "caseStudy" });
  const reindex = await postJson("/api/reindex", { type: "caseStudy" });

  const allowed = new Set([401, 500]);

  ensure(
    allowed.has(revalidate.res.status),
    `Expected 401 or 500 for /api/revalidate, got ${revalidate.res.status}`,
  );
  ensure(
    allowed.has(reindex.res.status),
    `Expected 401 or 500 for /api/reindex, got ${reindex.res.status}`,
  );

  if (revalidate.json) ensureErrorPayload(revalidate.json);
  if (reindex.json) ensureErrorPayload(reindex.json);

  console.log("[ok] webhook guards");
}

async function main() {
  const failures = [];
  const tasks = [
    { name: "ask validation", fn: checkAskValidation },
    { name: "ask happy path", fn: checkAskHappyPath },
    { name: "contact validation", fn: checkContactValidation },
    { name: "contact contract", fn: checkContactContract },
    { name: "webhook guards", fn: checkWebhookGuards },
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
