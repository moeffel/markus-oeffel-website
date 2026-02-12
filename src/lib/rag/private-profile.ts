import { readFile } from "fs/promises";
import { z } from "zod";

import { hasSanityConfig, sanityQuery } from "@/lib/cms/sanity";
import { localizedStringSchema } from "@/lib/content/schemas";

const privateProfileSchema = z.object({
  content: localizedStringSchema,
});

async function readOptionalFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function getPrivateProfileContent(): Promise<
  { de: string; en: string } | null
> {
  if (hasSanityConfig() && process.env.SANITY_API_TOKEN) {
    const query = `*[_type == "privateProfile"][0]{ content }`;
    const result = await sanityQuery<unknown | null>(
      query,
      undefined,
      {
        perspective: "published",
        tags: ["cms:private-profile"],
        revalidate: 300,
      },
    ).catch(() => null);

    const parsed = privateProfileSchema.safeParse(result);
    if (parsed.success) return parsed.data.content;
  }

  const path = process.env.PRIVATE_PROFILE_PATH ?? "private_corpus/high_profile_cv.md";
  const raw = await readOptionalFile(path);
  if (!raw) return null;

  return { de: raw, en: raw };
}

