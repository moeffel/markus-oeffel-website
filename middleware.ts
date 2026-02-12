import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LANGUAGE,
  isLanguage,
  pickLanguageFromAcceptLanguageHeader,
  type Language,
} from "@/lib/i18n";

function getLanguageFromPathname(pathname: string): Language | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return null;
  return isLanguage(segment) ? segment : null;
}

function getOrigin(input: string | undefined): string | null {
  if (!input) return null;
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function buildCsp(input: {
  nonce: string;
  plausibleOrigin: string | null;
  turnstileOrigin: string;
  sanityCdnOrigin: string;
}): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${input.nonce}'`,
    input.turnstileOrigin,
    ...(input.plausibleOrigin ? [input.plausibleOrigin] : []),
  ].join(" ");

  const connectSrc = [
    "'self'",
    input.turnstileOrigin,
    ...(input.plausibleOrigin ? [input.plausibleOrigin] : []),
  ].join(" ");

  const frameSrc = [input.turnstileOrigin].join(" ");

  const styleSrc = ["'self'", `'nonce-${input.nonce}'`].join(" ");

  const imgSrc = ["'self'", "data:", "blob:", input.sanityCdnOrigin].join(" ");

  const fontSrc = ["'self'", "data:"].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `font-src ${fontSrc}`,
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

function applyStaticSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasExtension = pathname.includes(".");
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_vercel") ||
    pathnameHasExtension
  ) {
    const response = NextResponse.next();
    applyStaticSecurityHeaders(response);
    return response;
  }

  const acceptLang = request.headers.get("accept-language");
  const picked =
    pickLanguageFromAcceptLanguageHeader(acceptLang) ?? DEFAULT_LANGUAGE;

  const pathnameLang = getLanguageFromPathname(pathname);

  if (!pathnameLang) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${picked}` : `/${picked}${pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lang", pathnameLang);

  let csp: string | null = null;
  if (process.env.NODE_ENV === "production") {
    const nonce = crypto.randomUUID().replace(/-/g, "");
    requestHeaders.set("x-nonce", nonce);

    const plausibleOrigin = getOrigin(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC);
    csp = buildCsp({
      nonce,
      plausibleOrigin,
      turnstileOrigin: "https://challenges.cloudflare.com",
      sanityCdnOrigin: "https://cdn.sanity.io",
    });

    requestHeaders.set("content-security-policy", csp);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  applyStaticSecurityHeaders(response);

  if (csp) {
    response.headers.set("Content-Security-Policy", csp);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|api/|_vercel/|.*\\..*).*)"],
};
