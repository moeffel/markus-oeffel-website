export type SanityPerspective = "published" | "previewDrafts";

type SanityQueryOptions = {
  perspective?: SanityPerspective;
  revalidate?: number;
  tags?: string[];
};

export function hasSanityConfig(): boolean {
  return Boolean(process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET);
}

function getSanityApiVersion(): string {
  return process.env.SANITY_API_VERSION ?? "2025-02-06";
}

function buildSanityQueryUrl(input: {
  projectId: string;
  dataset: string;
  query: string;
  params?: Record<string, unknown>;
  perspective?: SanityPerspective;
}): URL {
  const base = new URL(
    `https://${input.projectId}.api.sanity.io/v${getSanityApiVersion()}/data/query/${input.dataset}`,
  );

  base.searchParams.set("query", input.query);
  if (input.perspective && input.perspective !== "published") {
    base.searchParams.set("perspective", input.perspective);
  }

  for (const [key, value] of Object.entries(input.params ?? {})) {
    base.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  return base;
}

export async function sanityQuery<T>(
  query: string,
  params?: Record<string, unknown>,
  options?: SanityQueryOptions,
): Promise<T> {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  if (!projectId || !dataset) {
    throw new Error("Missing SANITY_PROJECT_ID or SANITY_DATASET.");
  }

  const url = buildSanityQueryUrl({
    projectId,
    dataset,
    query,
    params,
    perspective: options?.perspective,
  });

  const headers = new Headers();
  headers.set("accept", "application/json");

  const token = process.env.SANITY_API_TOKEN;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: options?.perspective === "previewDrafts" ? "no-store" : undefined,
    next:
      options?.perspective === "previewDrafts"
        ? undefined
        : {
            revalidate: options?.revalidate ?? 300,
            tags: options?.tags,
          },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Sanity query failed (${res.status} ${res.statusText}): ${text}`,
    );
  }

  const json = (await res.json().catch(() => null)) as
    | { result: T; error?: unknown }
    | null;
  if (!json) throw new Error("Sanity query returned invalid JSON.");
  if ("error" in json && json.error) {
    throw new Error(`Sanity query error: ${JSON.stringify(json.error)}`);
  }
  return json.result;
}

