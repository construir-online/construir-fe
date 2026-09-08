/**
 * Clases y ayudas de layout compartidas por las rejillas de categorías.
 *
 * Estaban duplicadas a mano en `/categorias` y en `FeaturedCategories`, y se
 * habían desincronizado: la página se quedó clavada en `grid-cols-3` a todos
 * los anchos, así que en escritorio salían tres tarjetas cuadradas de casi
 * 500px de lado. Centralizarlas evita que vuelva a pasar.
 */

/**
 * Rejilla de catálogo completo (página de categorías y drawer móvil).
 *
 * Se detiene en 7 columnas a propósito. La página lleva `max-w-7xl`, así que
 * pasados los 1280px el contenido ya no crece: añadir una octava columna sólo
 * repartía el mismo ancho entre más tarjetas (de 160px a 138px) y volvían a
 * truncarse nombres que a 1280 se leían enteros. Más pantalla no puede
 * significar menos legibilidad.
 */
export const CATEGORY_GRID_CLASS =
  'grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';

/** Número máximo de columnas que llega a usar CATEGORY_GRID_CLASS. */
export const CATEGORY_GRID_MAX_COLS = 7;

/**
 * Rejilla de destacadas del home. Tres columnas fijas en móvil y, a partir de
 * 640px, tantas columnas como categorías haya (ver `.featured-grid` en
 * globals.css, que lee la variable `--destacadas`).
 *
 * El número de columnas tiene que seguir al de categorías, no al revés: el
 * backend devuelve cinco destacadas y cualquier número fijo —cuatro como antes,
 * seis como en el primer intento de arreglo— dejaba huecos en la última fila.
 */
export const FEATURED_GRID_CLASS = 'featured-grid gap-2.5 sm:gap-4';

/** Tope de destacadas: más de seis en una sola fila salen demasiado estrechas. */
export const FEATURED_MAX = 6;

/**
 * Recorta la lista de destacadas al tope que cabe en una fila de escritorio.
 */
export function limitarDestacadas<T>(categorias: readonly T[], max = FEATURED_MAX): T[] {
  return categorias.slice(0, Math.max(0, max));
}

/**
 * Columnas que debe usar la fila de destacadas en escritorio: exactamente
 * tantas como categorías se pinten, para que nunca sobre un hueco a la derecha.
 */
export function columnasDestacadas(cantidad: number, max = FEATURED_MAX): number {
  const n = Math.floor(cantidad) || 0;
  return Math.min(Math.max(n, 1), Math.max(1, max));
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
