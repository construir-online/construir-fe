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
 * Para volver a ofrecer el selector hay que hacer estas CUATRO cosas:
 *
 *   1. Poner `SELECTOR_IDIOMA_ACTIVO = true` (abajo). Eso hace que
 *      `resolverLocale()` vuelva a mirar la cookie `NEXT_LOCALE` y, si no hay,
 *      el header `accept-language` — la lógica original sigue escrita aquí y
 *      está cubierta por pruebas, así que no hace falta reescribirla.
 *   2. En `src/components/Navbar.tsx` hay TRES marcadores "selector de idioma
 *      desmontado". Los dos primeros (barra móvil y bloque de invitado) se
 *      arreglan reponiendo el `import LanguageSwitcher from "./LanguageSwitcher"`
 *      y el `<LanguageSwitcher />`. El TERCERO no: el bloque "Idioma" del menú
 *      de usuario logueado se borró y hay que recuperarlo del commit anterior:
 *
 *          git show deploy/solo-direccion-manual:src/components/Navbar.tsx
 *
 *      De ahí hay que reponer, además del JSX del bloque, los imports
 *      `useLocale` (next-intl) y `useRouter` (next/navigation), la constante
 *      `LANGUAGES` y la función `handleLanguageChange`.
 *   3. `src/components/LanguageSwitcher.tsx` se conservó intacto y compilando:
 *      ese componente no hay que reescribirlo, basta con volver a importarlo.
 *      (Ojo: eso vale para el switcher de escritorio y móvil, NO para el bloque
 *      "Idioma" del menú de usuario del punto 2.)
 *   4. Arreglar las pruebas de `src/lib/__tests__/locale.test.ts`. Al encender
 *      el interruptor fallan 3 a propósito (las que fijan que hoy sale español
 *      pase lo que pase); son el aviso de que el cambio fue deliberado, no una
 *      regresión. Hay que borrar esos casos del bloque "con el selector de
 *      idioma apagado" o moverlos al bloque "encendido", que ya cubre el
 *      parseo de la cookie y del `accept-language`. Sin este paso CI se pone
 *      rojo y quien siga estos pasos al pie de la letra no sabrá por qué.
 *
 * Y una cosa a corregir de paso, que ya venía mal de antes: `src/app/layout.tsx`
 * tiene `lang="es"` cableado en el `<html>`. Hoy no molesta porque la tienda va
 * siempre en español, pero con el selector encendido el atributo miente cuando
 * el usuario elige inglés. Al revertir, sacar ese `lang` del locale real.
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
 *
 * El segundo parámetro sólo existe para las pruebas: con el interruptor como
 * `const` literal, la rama "encendida" —que es justo la que se va a ejecutar el
 * día que se reactive el selector— quedaba sin vigilar, y nadie se enteraría de
 * que se rompió hasta después de revertir. En producción nunca se pasa.
 */
export function resolverLocale(
  entrada: {
    cookie?: string | null;
    acceptLanguage?: string | null;
  },
  activo: boolean = SELECTOR_IDIOMA_ACTIVO,
): Locale {
  if (!activo) {
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
