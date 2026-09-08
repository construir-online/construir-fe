import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { locales, resolverLocale } from './src/lib/locale';

export { locales };
export type { Locale } from './src/lib/locale';

// El idioma se decide en `src/lib/locale.ts` — ahí está explicado por qué está
// fijo en español y qué hay que tocar para volver a ofrecer el selector.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const locale = resolverLocale({
    cookie: cookieStore.get('NEXT_LOCALE')?.value,
    acceptLanguage: headersList.get('accept-language'),
  });

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
