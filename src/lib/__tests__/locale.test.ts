import { describe, it, expect } from 'vitest';
import {
  resolverLocale,
  locales,
  LOCALE_POR_DEFECTO,
  SELECTOR_IDIOMA_ACTIVO,
} from '../locale';
import esMessages from '../../../messages/es.json';
import enMessages from '../../../messages/en.json';

/**
 * Evita la regresión de "la tienda se me puso en inglés sola": antes el idioma
 * salía de la cookie `NEXT_LOCALE` o del `accept-language` del navegador, así
 * que un cliente con el navegador en inglés (o con la cookie vieja pegada de
 * cuando existía el selector) veía la tienda a medio traducir y creía que
 * estaba rota. Mientras el selector esté apagado, esto debe dar `es` siempre.
 */
describe('resolverLocale con el selector de idioma apagado', () => {
  it('devuelve español sin cookie ni header', () => {
    expect(resolverLocale({})).toBe('es');
    expect(resolverLocale({ cookie: null, acceptLanguage: null })).toBe('es');
  });

  it('ignora la cookie NEXT_LOCALE aunque pida inglés', () => {
    // La cookie dura un año: la que quedó grabada antes del cambio no debe
    // seguir mandando.
    expect(resolverLocale({ cookie: 'en' })).toBe('es');
    expect(resolverLocale({ cookie: 'en', acceptLanguage: 'en-US,en;q=0.9' })).toBe('es');
  });

  it('ignora el accept-language del navegador', () => {
    expect(resolverLocale({ acceptLanguage: 'en-US,en;q=0.9' })).toBe('es');
    expect(resolverLocale({ acceptLanguage: 'fr-FR,fr;q=0.9' })).toBe('es');
  });

  it('no se cae con valores basura', () => {
    expect(resolverLocale({ cookie: 'xx', acceptLanguage: '' })).toBe('es');
    expect(resolverLocale({ cookie: '', acceptLanguage: ',,,' })).toBe('es');
  });

  it('el interruptor está apagado y el idioma por defecto es español', () => {
    // Si alguien lo enciende sin querer, este test avisa antes que el cliente.
    expect(SELECTOR_IDIOMA_ACTIVO).toBe(false);
    expect(LOCALE_POR_DEFECTO).toBe('es');
  });
});

/**
 * La infraestructura de i18n se mantiene entera a propósito: apagar el selector
 * no debe convertirse con el tiempo en "borramos las traducciones". Si alguien
 * elimina `en.json` o desalinea las claves, reactivar el selector volvería a
 * mostrar claves crudas tipo `auth.login` en pantalla.
 */
describe('infraestructura de i18n intacta', () => {
  it('sigue declarando los dos idiomas', () => {
    expect(locales).toEqual(['es', 'en']);
  });

  it('los dos catálogos de mensajes existen y comparten las secciones', () => {
    expect(Object.keys(esMessages).length).toBeGreaterThan(0);
    expect(Object.keys(enMessages).sort()).toEqual(Object.keys(esMessages).sort());
  });
});
