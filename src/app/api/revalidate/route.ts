import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/security/hmac";

const bodySchema = z
  .object({
    documentType: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    paths: z.array(z.string()).optional(),
  })
  .passthrough();

function signatureFromRequest(request: Request): string | null {
  return (
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-signature") ??
    null
  );
}

function toPaths(input: {
  documentType?: string;
  type?: string;
  slug?: string;
  paths?: string[];
}): string[] {
  if (input.paths?.length) return input.paths;

  const t = input.documentType ?? input.type ?? "";
  const slug = input.slug;
  const langs = ["de", "en"] as const;

  const out: string[] = [];
  for (const lang of langs) {
    if (t === "caseStudy" && slug) {
      out.push(`/${lang}`);
      out.push(`/${lang}/projects`);
      out.push(`/${lang}/projects/${slug}`);
    } else if (t === "thesis") {
      out.push(`/${lang}/thesis`);
      out.push(`/${lang}/projects`);
    } else if (t === "experienceItem") {
      out.push(`/${lang}/experience`);
    } else if (t === "siteSettings") {
      out.push(`/${lang}`);
    } else {
      out.push(`/${lang}`);
      out.push(`/${lang}/projects`);
      out.push(`/${lang}/experience`);
      out.push(`/${lang}/thesis`);
      out.push(`/${lang}/ask`);
      out.push(`/${lang}/contact`);
    }
  }

  out.push("/sitemap.xml");
  return Array.from(new Set(out));
}

function toTags(input: {
  documentType?: string;
  type?: string;
  slug?: string;
}): string[] {
  const t = input.documentType ?? input.type ?? "";
  const slug = input.slug;

  const tags: string[] = [];
  if (t === "caseStudy") {
    tags.push("cms:case-studies");
    if (slug) tags.push(`cms:case-study:${slug}`);
  } else if (t === "thesis") {
    tags.push("cms:thesis", "cms:case-study:thesis");
  } else if (t === "experienceItem") {
    tags.push("cms:experience");
  } else if (t === "siteSettings") {
    tags.push("cms:site-settings");
  } else if (t === "skillCategory") {
    tags.push("cms:skills");
  } else if (t === "howIWorkPrinciple") {
    tags.push("cms:how-i-work");
  } else if (t === "privateProfile") {
    tags.push("cms:private-profile");
  } else {
    tags.push(
      "cms:case-studies",
      "cms:thesis",
      "cms:experience",
      "cms:site-settings",
      "cms:skills",
      "cms:how-i-work",
      "cms:private-profile",
    );
  }

  return Array.from(new Set(tags));
}

export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "missing_webhook_secret" },
      { status: 500 },
    );
  }

  const signature = signatureFromRequest(request);
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  const rawBody = await request.text().catch(() => "");
  const expected = hmacSha256Hex(secret, rawBody);
  if (!timingSafeEqualHex(signature, expected)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const bodyRaw = JSON.parse(rawBody || "{}");
  const body = bodySchema.parse(bodyRaw);

  const paths = toPaths(body);
  for (const path of paths) revalidatePath(path);

  const tags = toTags(body);
  for (const tag of tags) revalidateTag(tag, "default");

  return NextResponse.json({ ok: true, revalidated: paths, revalidated_tags: tags });
}
