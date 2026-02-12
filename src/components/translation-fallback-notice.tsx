import Link from "next/link";

import type { Language } from "@/lib/i18n";

export function TranslationFallbackNotice(input: {
  lang: Language;
  fallbackFrom: Language | null;
  href: string;
}) {
  if (!input.fallbackFrom) return null;

  return (
    <div className="rounded-2xl border border-[var(--accent-cyan)]/35 bg-[rgba(93,217,255,0.1)] px-4 py-3 text-sm text-[var(--accent-cyan)]">
      {input.lang === "de"
        ? `Noch nicht komplett übersetzt. Inhalt aus ${input.fallbackFrom.toUpperCase()} wird angezeigt.`
        : `Not fully translated yet. Showing ${input.fallbackFrom.toUpperCase()} content.`}{" "}
      <Link
        href={input.href}
        className="font-semibold underline decoration-current underline-offset-2 transition hover:text-foreground"
        hrefLang={input.fallbackFrom}
      >
        {input.lang === "de" ? "Original öffnen" : "Open original"}
      </Link>
    </div>
  );
}
