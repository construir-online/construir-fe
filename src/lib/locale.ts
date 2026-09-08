/**
 * Resolución del idioma de la interfaz.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IDIOMA FIJO EN ESPAÑOL — CÓMO REVERTIRLO
 * ─────────────────────────────────────────────────────────────────────────────
 * El cliente pidió que la tienda salga siempre en español: el público es
 * venezolano y el selector de idioma sólo servía para que alguien dejara la
 * tienda a medio traducir en inglés sin querer (la cookie `NEXT_LOCALE` es
 * persistente, así que el usuario se quedaba en inglés en todas las visitas
 * siguientes y llamaba a soporte creyendo que la web estaba rota).
 *
 * NO se desmontó la infraestructura de i18n: next-intl, `messages/es.json`,
 * `messages/en.json` y todos los `useTranslations` siguen exactamente igual.
 * Sólo se dejó de *elegir* idioma y se dejó de *mostrar* el selector.
 *
 * Para volver a ofrecer el selector hay que hacer estas tres cosas:
 *
 *   1. Poner `SELECTOR_IDIOMA_ACTIVO = true` (abajo). Eso hace que
 *      `resolverLocale()` vuelva a mirar la cookie `NEXT_LOCALE` y, si no hay,
 *      el header `accept-language` — la lógica original sigue escrita aquí.
 *   2. En `src/components/Navbar.tsx`, volver a montar `<LanguageSwitcher />`
 *      en los dos sitios marcados con el comentario "selector de idioma
 *      desmontado" (barra móvil y bloque de invitado), y reponer el bloque
 *      "Idioma" dentro del menú de usuario logueado.
 *   3. `src/components/LanguageSwitcher.tsx` se conservó intacto y compilando,
 *      así que no hay que reescribir nada: basta con volver a importarlo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Idioma que se sirve cuando el selector está apagado, o cuando no se resuelve otro. */
export const LOCALE_POR_DEFECTO: Locale = 'es';

/** Interruptor único del selector de idioma. Ver el bloque de arriba para reactivarlo. */
export const SELECTOR_IDIOMA_ACTIVO = false;

/**
 * Devuelve el idioma con el que se debe renderizar la petición.
 *
 * Con el selector apagado ignora a propósito la cookie y el header: aunque el
 * navegador pida `en` o quede una cookie `NEXT_LOCALE=en` de antes del cambio,
 * la tienda responde en español.
 */
export function resolverLocale(entrada: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (!SELECTOR_IDIOMA_ACTIVO) {
    return LOCALE_POR_DEFECTO;
  }

  const cookie = entrada.cookie ?? '';
  if (esLocaleSoportado(cookie)) {
    return cookie;
  }

  // Sin cookie: se respeta la preferencia del navegador ("es-VE,es;q=0.9" → "es").
  const preferido = (entrada.acceptLanguage ?? '').split(',')[0].split('-')[0];
  return esLocaleSoportado(preferido) ? preferido : LOCALE_POR_DEFECTO;
}

function esLocaleSoportado(valor: string): valor is Locale {
  return (locales as readonly string[]).includes(valor);
}
