// Mock global de next-intl para todos los tests unitarios/componentes
// Retorna la key de traducción tal cual — suficiente para verificar comportamiento
import { createElement, Fragment, type ReactNode } from 'react';

type ValoresRich = Record<string, unknown>;

export const useTranslations = () => {
  const t = (key: string) => key;
  // `t.has()` lo usan las pantallas con claves dinámicas (los recursos de los
  // audit logs, por ejemplo): acá siempre resuelve, igual que `t`.
  t.has = () => true;
  /**
   * `t.rich()` es lo que usan los textos que llevan una parte con formato
   * dentro de la frase — un correo en negrita, un enlace a mitad de oración.
   *
   * El mock no conoce el texto real, así que no puede saber qué trozo va
   * dentro de cada etiqueta. Devuelve la clave y, a continuación, el resultado
   * de invocar cada etiqueta: así lo que la pantalla mete dentro —el correo del
   * cliente, el enlace— queda en el DOM y se puede afirmar sobre ello, que es
   * justo lo que estos tests necesitan comprobar.
   */
  t.rich = (key: string, valores?: ValoresRich): ReactNode => {
    const etiquetas = Object.values(valores ?? {}).filter(
      (v): v is (chunks: ReactNode) => ReactNode => typeof v === 'function',
    );
    return createElement(
      Fragment,
      null,
      key,
      ...etiquetas.map((fn, i) => createElement(Fragment, { key: i }, fn(key))),
    );
  };
  return t;
};
export const useLocale = () => 'es';
export const useMessages = () => ({});
export const NextIntlClientProvider = ({ children }: { children: ReactNode }) => children;
