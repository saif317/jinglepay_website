export function localizePath(basePath: string, country: string, lang: string) {
  if (typeof basePath !== 'string' || !country || !lang) {
    console.warn('localizePath: Invalid input provided. Returning original path or root.');
    return basePath || '/';
  }

  const currentLocalePrefix = `/${country}/${lang}`;
  if (basePath.startsWith(currentLocalePrefix + '/') || basePath === currentLocalePrefix) {
    return basePath;
  }

  if (
    basePath.startsWith('http') ||
    basePath.startsWith('#') ||
    basePath.startsWith('mailto:') ||
    basePath.startsWith('tel:')
  ) {
    return basePath;
  }

  const cleanBasePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;

  if (cleanBasePath === '') {
    return `/${country}/${lang}`;
  }

  return `/${country}/${lang}/${cleanBasePath}`;
}
