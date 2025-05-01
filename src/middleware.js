import { defineMiddleware } from 'astro:middleware';
import { COUNTRIES } from './constants';

const DEFAULT_COUNTRY_CODE = 'pak';
const DEFAULT_LANG_CODE = 'en';

const NON_LOCALIZED_PATHS = [
  '/contact',
  '/about',
  '/terms-of-service',
  ...COUNTRIES.map((c) => `/${c.path}/app-redirect`),
];

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
  let pathname = url.pathname;
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

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

  if (NON_LOCALIZED_PATHS.includes(pathname)) {
    console.log(`Allowing non-localized path: ${pathname}`);
    return next();
  }

  if (pathname === '/' || pathname === '') {
    const defaultPath = `/${DEFAULT_COUNTRY_CODE}/${DEFAULT_LANG_CODE}`;
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
      console.log(`Valid localized path detected: /${countryCode}/${langCode}/`);
      const translations = await loadTranslations(countryCode, langCode);

      ctx.locals.lang = langCode;
      ctx.locals.country = countryCode;
      ctx.locals.translations = translations;

      const remainingPath = segments.slice(2).join('/') || '';
      ctx.locals.originalPath = pathname;
      ctx.locals.basePath = `/${countryCode}/${langCode}`;
      ctx.locals.subPath = remainingPath;

      return next();
    } else {
      console.warn(`Invalid country/lang combination in path: "${pathname}".`);
    }
  } else {
    console.warn(
      `Path "${pathname}" does not match expected structure /[country]/[lang]/ and is not in NON_LOCALIZED_PATHS.`
    );
  }

  const defaultRedirectPath = `/${DEFAULT_COUNTRY_CODE}/${DEFAULT_LANG_CODE}`; // Redirect to default locale root
  console.log(`Redirecting invalid or unmatched path "${pathname}" to default: ${defaultRedirectPath}`);

  if (pathname.startsWith(`/${DEFAULT_COUNTRY_CODE}/${DEFAULT_LANG_CODE}`)) {
    console.error(`Potential redirect loop detected for path "${pathname}". Aborting redirect.`);

    return new Response('Server configuration error prevented redirect.', { status: 500 });
  }

  return ctx.redirect(defaultRedirectPath, 302);
});
