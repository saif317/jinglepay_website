export function getStaticPathsWrapper(countries: string[], languages: Record<string, string[]>) {
  return async function () {
    return countries.flatMap((country) => {
      return languages[country].map((lang) => {
        return {
          params: { country, lang },
        };
      });
    });
  };
}
