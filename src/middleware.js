import { defineMiddleware } from 'astro:middleware';
import { middleware, redirectToDefaultLocale } from 'astro:i18n';
import { COUNTRIES } from './constants';

// Custom middleware to handle country/language detection and routing
export const countryLanguageMiddleware = defineMiddleware(async (ctx, next) => {
  return next();

  const url = new URL(ctx.request.url);
  const pathname = url.pathname;

  // Skip for static assets and API routes
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/api/') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg')
  ) {
    return next();
  }

  // If we're at the root, detect country/language
  if (pathname === '/' || pathname === '') {
    // On client-side, index.astro will handle the detection and redirect
    return next();
  }

  // Check if the URL already follows our country/language pattern
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length >= 2) {
    const country = segments[0];
    const lang = segments[1];

    // Validate if this is a valid country/language combination
    const validCountry = COUNTRIES.find((c) => c.path === country);

    if (validCountry) {
      const validLang = validCountry.languages.find((l) => l.code === lang);
      if (validLang) {
        // Valid combination, proceed
        return next();
      }
    }
  }

  // Invalid URL format, redirect to default locale
  return redirectToDefaultLocale(ctx, 302);
});

// Use sequence to combine our middleware with Astro's built-in i18n middleware
export const onRequest = countryLanguageMiddleware;
