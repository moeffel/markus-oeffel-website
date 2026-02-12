export const SUPPORTED_LANGUAGES = ["de", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type LocalizedSelection<T> = {
  value: T;
  usedFallback: boolean;
  fallbackFrom: Language | null;
};

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function getAlternateLanguage(lang: Language): Language {
  return lang === "de" ? "en" : "de";
}

export function getLanguageFromPathname(pathname: string): Language | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return null;
  return isLanguage(segment) ? segment : null;
}

export function pickLanguageFromAcceptLanguageHeader(
  acceptLanguageHeader: string | null,
): Language {
  if (!acceptLanguageHeader) return DEFAULT_LANGUAGE;

  const firstToken = acceptLanguageHeader.split(",")[0]?.trim();
  const primaryTag = firstToken?.split("-")[0]?.toLowerCase();
  return primaryTag === "de" ? "de" : DEFAULT_LANGUAGE;
}

export function pickLocalizedString(
  input: Record<Language, string>,
  lang: Language,
): LocalizedSelection<string> {
  const current = input[lang]?.trim() ?? "";
  if (current) {
    return { value: current, usedFallback: false, fallbackFrom: null };
  }

  const alt = getAlternateLanguage(lang);
  const fallback = input[alt]?.trim() ?? "";
  if (fallback) {
    return { value: fallback, usedFallback: true, fallbackFrom: alt };
  }

  return { value: "", usedFallback: false, fallbackFrom: null };
}

export function pickLocalizedArray<T>(
  input: Record<Language, readonly T[]>,
  lang: Language,
): LocalizedSelection<readonly T[]> {
  const current = input[lang] ?? [];
  if (current.length > 0) {
    return { value: current, usedFallback: false, fallbackFrom: null };
  }

  const alt = getAlternateLanguage(lang);
  const fallback = input[alt] ?? [];
  if (fallback.length > 0) {
    return { value: fallback, usedFallback: true, fallbackFrom: alt };
  }

  return { value: [], usedFallback: false, fallbackFrom: null };
}
