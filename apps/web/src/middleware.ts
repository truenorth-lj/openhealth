import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales, isValidLocale } from "@/lib/i18n-config";

// Cookie name for user's explicit locale preference
const LOCALE_COOKIE = "NEXT_LOCALE";

// Public paths that need locale routing (SEO pages)
const PUBLIC_PATHS = ["/", "/blog", "/docs", "/privacy", "/pricing", "/support"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function negotiateLocale(acceptLanguage: string): string {
  // Parse Accept-Language header and find best match
  const parts = acceptLanguage.split(",");
  for (const part of parts) {
    const lang = part.split(";")[0]?.trim().toLowerCase();
    if (!lang) continue;

    // Exact match
    for (const locale of locales) {
      if (lang === locale.toLowerCase()) return locale;
    }

    // Prefix match (e.g., "en-US" matches "en")
    const prefix = lang.split("-")[0];
    for (const locale of locales) {
      if (prefix === locale.toLowerCase().split("-")[0]) return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path starts with a locale prefix
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  const hasLocalePrefix = maybeLocale ? isValidLocale(maybeLocale) : false;

  if (hasLocalePrefix && maybeLocale) {
    if (maybeLocale === defaultLocale) {
      // /zh-TW/blog -> /blog (canonical redirect, default locale should be unprefixed)
      const newPath = "/" + segments.slice(2).join("/") || "/";
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.redirect(url);
    }
    // /en/blog -> pass through, [locale] route will handle it
    // Set x-locale header for root layout and save cookie
    const response = NextResponse.next();
    response.headers.set("x-locale", maybeLocale);
    response.cookies.set(LOCALE_COOKIE, maybeLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  }

  // No locale prefix — check if this is a public path
  if (!isPublicPath(pathname)) {
    // Dashboard, API, auth routes — pass through without locale
    // Still set x-locale header so root layout can set correct <html lang>
    const response = NextResponse.next();
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale =
      cookieLocale && isValidLocale(cookieLocale)
        ? cookieLocale
        : defaultLocale;
    response.headers.set("x-locale", locale);
    return response;
  }

  // Check cookie first (user's explicit preference), then Accept-Language
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferredLocale =
    cookieLocale && isValidLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language") ?? "");

  if (preferredLocale !== defaultLocale) {
    // Redirect to /en/... (non-default locale gets prefixed URL)
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Default locale: rewrite internally to /zh-TW/... (URL stays clean as /)
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-locale", defaultLocale);
  response.cookies.set(LOCALE_COOKIE, defaultLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next|api|manifest\\.json|icons|sw\\.js|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
