import type { MetadataRoute } from "next";

import { getCaseStudies } from "@/lib/content";
import type { Language } from "@/lib/i18n";
import { getSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isPublicIndexingEnabled()) {
    return [];
  }

  const base = getSiteUrl();
  const langs: Language[] = ["de", "en"];

  const staticPaths = [
    "",
    "/projects",
    "/experience",
    "/skills",
    "/thesis",
    "/ask",
    "/contact",
  ];

  const legalPathsByLang: Record<Language, string[]> = {
    de: ["/impressum", "/datenschutz"],
    en: ["/imprint", "/privacy"],
  };

  const caseStudySlugs = (await getCaseStudies({ publishedOnly: true }))
    .map((c) => c.slug)
    .filter((s) => s !== "thesis");

  const urls: string[] = [];
  for (const lang of langs) {
    for (const p of staticPaths) urls.push(`/${lang}${p}`);
    for (const p of legalPathsByLang[lang]) urls.push(`/${lang}${p}`);
    for (const slug of caseStudySlugs) urls.push(`/${lang}/projects/${slug}`);
  }

  const now = new Date();
  return urls.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
}
