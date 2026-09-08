/**
 * Clases y ayudas de layout compartidas por las rejillas de categorías.
 *
 * Estaban duplicadas a mano en `/categorias`, en el `CategoryDrawer` y en
 * `FeaturedCategories`, y se habían desincronizado: la página y el drawer se
 * quedaron clavados en `grid-cols-3` a todos los anchos, así que en escritorio
 * salían tres tarjetas cuadradas de casi 500px de lado. Centralizarlas evita
 * que vuelva a pasar.
 */

/**
 * Rejilla de catálogo completo (página de categorías y drawer móvil).
 * Sube de 3 a 8 columnas para que la tarjeta nunca crezca por encima de ~180px.
 */
export const CATEGORY_GRID_CLASS =
  'grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8';

/** Número máximo de columnas que llega a usar CATEGORY_GRID_CLASS. */
export const CATEGORY_GRID_MAX_COLS = 8;

/**
 * Rejilla de destacadas del home. Sólo usa 3 y 6 columnas —ambas divisores de
 * las 6 categorías que se muestran— porque el paso intermedio de 4 columnas
 * dejaba tres huecos en la última fila entre 640px y 1023px.
 */
export const FEATURED_GRID_CLASS =
  'grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-6';

/** Cuántas destacadas caben sin dejar filas cojas en la rejilla de arriba. */
export const FEATURED_MAX = 6;

/**
 * Recorta la lista de destacadas al máximo que la rejilla puede colocar en
 * filas completas. Sin esto, siete u ocho categorías dejaban una fila con una
 * sola tarjeta perdida a la izquierda.
 */
export function limitarDestacadas<T>(categorias: readonly T[], max = FEATURED_MAX): T[] {
  return categorias.slice(0, Math.max(0, max));
}

/**
 * Número de esqueletos a pintar mientras carga. Se redondea al múltiplo del
 * número de columnas más ancho para que la última fila del esqueleto no quede
 * incompleta y el salto de layout al llegar los datos sea mínimo.
 */
export function contarEsqueletos(columnas: number, minimo = 12): number {
  const cols = Math.max(1, Math.floor(columnas) || 1);
  return Math.ceil(Math.max(1, minimo) / cols) * cols;
}
