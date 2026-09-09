import { apiClient } from '@/lib/api';

/** Topes que impone el backend (`CreatePageViewDto`), que son los de sus columnas. */
const LIMITES: Record<keyof PageViewDto, number> = {
  path: 500,
  title: 500,
  referrer: 500,
};

/**
 * Recorta cada campo a lo que el backend acepta.
 *
 * `document.referrer` es una URL ajena y puede pasar de 500 caracteres sin
 * problema. Antes eso reventaba el varchar contra la base; ahora el backend
 * valida longitudes y devolvería un 400, así que la visita se perdería entera
 * por un referrer largo. Recortando aquí se sigue registrando la visita, que es
 * lo único que se consulta de esta tabla.
 */
function recortar(data: PageViewDto): PageViewDto {
  const salida: PageViewDto = { ...data };
  (Object.keys(LIMITES) as Array<keyof PageViewDto>).forEach((campo) => {
    const valor = salida[campo];
    if (typeof valor === 'string' && valor.length > LIMITES[campo]) {
      salida[campo] = valor.slice(0, LIMITES[campo]);
    }
  });
  return salida;
}

export interface PageViewDto {
  path: string;
  title?: string;
  /**
   * Se manda entero; el backend lo recorta a su origen antes de guardarlo.
   *
   * La regla de recorte no se copia aquí a propósito: vive en un solo sitio
   * (`aOrigenDeReferrer`, en el backend), que es el que la aplica a todos sus
   * clientes. Dos definiciones de "origen" en dos repos distintos acabarían
   * discrepando sin que nadie se entere.
   */
  referrer?: string;
}

/**
 * Registro de visitas contra el backend propio.
 *
 * Sólo escribe. Aquí vivían además un `getPageViews` y un `PageViewStats` que
 * no llamaba nadie: ninguna pantalla del panel consulta la analítica. Y no eran
 * código muerto inofensivo, porque además mentían — `PageViewStats` describía
 * `uniqueVisitors`, `averageTimeOnPage` y `bounceRate`, que el backend no
 * calcula ni ha calculado nunca: sus dos lecturas devuelven totales por fecha y
 * un ranking por `path`. Se borraron para que nadie construya encima de una
 * forma inventada.
 */
export const analyticsService = {
  /**
   * Track a page view in the backend
   */
  async trackPageView(data: PageViewDto): Promise<void> {
    try {
      await apiClient.post('/analytics/page-view', recortar(data));
    } catch (error) {
      console.error('Error tracking page view:', error);
      // Silently fail - analytics shouldn't block user experience
    }
  }
};
