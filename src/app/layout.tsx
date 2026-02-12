import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

import { PlausibleProvider } from "@/components/analytics/plausible-provider";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/i18n";
import { getSiteUrl, isPublicIndexingEnabled } from "@/lib/seo";

const publicIndexingEnabled = isPublicIndexingEnabled();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Markus Öffel's Website",
  description: "Finance-class portfolio with cyberpunk AI accents.",
  robots: publicIndexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const langHeader = requestHeaders.get("x-lang");
  const lang =
    langHeader && isLanguage(langHeader) ? langHeader : DEFAULT_LANGUAGE;
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;
  const plausibleDomain =
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ??
    (() => {
      try {
        return new URL(getSiteUrl()).hostname;
      } catch {
        return undefined;
      }
    })();

  return (
    <html lang={lang}>
      <body className="antialiased bg-background text-foreground">
        {plausibleSrc && plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src={plausibleSrc}
            strategy="afterInteractive"
            nonce={nonce}
          />
        ) : null}
        <PlausibleProvider />
        {children}
      </body>
    </html>
  );
}
