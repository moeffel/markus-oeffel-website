import type { Metadata } from "next";

import type { Language } from "@/lib/i18n";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function isPublicIndexingEnabled(): boolean {
  const raw = process.env.ENABLE_PUBLIC_INDEXING;
  if (!raw) return false;

  const normalized = raw.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function alternatesForPath(input: {
  lang: Language;
  pathAfterLang?: string;
}): Metadata["alternates"] {
  const pathAfterLang = input.pathAfterLang ?? "";
  const normalized =
    pathAfterLang === "" || pathAfterLang.startsWith("/")
      ? pathAfterLang
      : `/${pathAfterLang}`;

  const canonical = `/${input.lang}${normalized}`;
  return {
    canonical,
    languages: {
      de: `/de${normalized}`,
      en: `/en${normalized}`,
    },
  };
}
