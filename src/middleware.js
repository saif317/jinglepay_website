import { defineMiddleware } from 'astro:middleware';
import { COUNTRIES } from './constants';

const translationModules = import.meta.glob('/src/constants/locale/*/*/translation.js');

async function loadTranslations(countryCode, langCode) {
  const modulePath = `/src/constants/locale/${countryCode}/${langCode}/translation.js`;
  const moduleLoader = translationModules[modulePath];

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

  return next();
});
