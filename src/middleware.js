import { defineMiddleware } from 'astro:middleware';
import { COUNTRIES } from './constants';

const DEFAULT_COUNTRY_CODE = 'pak';
const DEFAULT_LANG_CODE = 'en';

const translationModules = import.meta.glob('/src/constants/locale/*/*/translation.js');

async function loadTranslations(countryCode, langCode) {
  const modulePath = `/src/constants/locale/${countryCode}/${langCode}/translation.js`;
  const moduleLoader = translationModules[modulePath]; // Get the loader function

  if (!moduleLoader) {
    console.error(
      `Translation module not found for "${countryCode}/${langCode}". Path checked: ${modulePath}. Check import.meta.glob pattern and file location.`
    );
    return {};
  }

  try {
    const module = await moduleLoader();
    return module.default || {};
  } catch (error) {
    console.error(`Failed to execute translation module load for "${countryCode}/${langCode}": ${error.message}`);
    return {};
  }
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const pathname = url.pathname;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/_image') ||
    pathname === '/favicon.ico' ||
    /\.(css|js|json|webmanifest|txt|xml|map)$/i.test(pathname) ||
    /\.(png|jpe?g|gif|svg|webp|ico|avif|bmp|tiff?)$/i.test(pathname) ||
    /\.(mp4|mov|avi|webm|ogg)$/i.test(pathname) ||
    /\.(mp3|wav|aac|flac)$/i.test(pathname) ||
    /\.(woff2?|ttf|otf|eot)$/i.test(pathname)
  ) {
    return next();
  }

  if (pathname === '/' || pathname === '') {
    const defaultPath = `/${DEFAULT_COUNTRY_CODE}/${DEFAULT_LANG_CODE}/`;
    console.log(`Redirecting root to default: ${defaultPath}`);
    return ctx.redirect(defaultPath, 302);
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length >= 2) {
    const countryCode = segments[0];
    const langCode = segments[1];

    const validCountry = COUNTRIES.find((c) => c.path === countryCode);
    const validLang = validCountry?.languages.find((l) => l.code === langCode);

    if (validCountry && validLang) {
      console.log(`Valid path detected: /${countryCode}/${langCode}/`);
      const translations = await loadTranslations(countryCode, langCode);

      if (Object.keys(translations).length === 0 && !(await loadTranslations(countryCode, DEFAULT_LANG_CODE))) {
        console.warn(`No translations found for ${countryCode}/${langCode} and no fallback available.`);
      }

      ctx.locals.lang = langCode;
      ctx.locals.country = countryCode;
      ctx.locals.translations = translations;

      return next();
    } else {
      console.warn(`Invalid country/lang combination in path: "${pathname}".`);
    }
  } else {
    console.warn(`Path "${pathname}" does not match expected structure /[country]/[lang]/.`);
  }

  const defaultPath = `/${DEFAULT_COUNTRY_CODE}/${DEFAULT_LANG_CODE}/`;
  console.log(`Redirecting invalid path "${pathname}" to default: ${defaultPath}`);
  if (pathname.startsWith(defaultPath)) {
    console.error('Potential redirect loop detected. Aborting redirect to default path.');
    return new Response('Configuration Error: Default path invalid or causing loop.', { status: 500 });
  }

  return ctx.redirect(defaultPath, 302);
});
