/**
 * Las barras que se pegan al borde inferior en móvil, y el hueco que hay que
 * dejarles.
 *
 * Hay tres cosas peleándose por ese borde y no todas aparecen a la vez:
 *
 *  - `BottomNav`, la navegación inferior. Mide **50 px** medidos en el
 *    navegador a 390 px, más el `safe-area-inset-bottom` del teléfono.
 *  - `CartSummaryBar`, la barra flotante de carrito, que sólo sale cuando hay
 *    algo en el carrito.
 *  - el pie de página, que va después del contenido y no es fijo.
 *
 * El pie ya se perdió una vez detrás de una barra fija: llevaba `hidden
 * md:block`, se hizo visible en móvil y entonces la navegación inferior le
 * tapaba el copyright y los enlaces legales — justo lo que se venía a
 * rescatar. Por eso los números viven acá y no sueltos en cada componente:
 * quien añada una barra nueva tiene que pasar por este archivo y sumar su
 * alto al hueco del pie, en vez de descubrir el solape en producción.
 *
 * Son cadenas de clases completas y literales a propósito. Tailwind busca las
 * clases por texto en el código fuente: una clase armada por concatenación
 * (`` `pb-[${alto}]` ``) no la encuentra y el estilo no llega a la hoja, que
 * es exactamente el fallo silencioso que produce el solape.
 */

/** Alto de `BottomNav`, medido en el navegador a 390 px. */
export const ALTO_BARRA_INFERIOR_PX = 50;

/**
 * Alto de `CartSummaryBar` cuando se apoya en otra barra, medido igual.
 * Se redondea hacia arriba a 4.5rem (72 px) para el hueco del pie.
 */
export const ALTO_BARRA_CARRITO_PX = 72;

/**
 * Posición de la barra de carrito.
 *
 * Cuando hay navegación inferior, la barra se apoya justo encima de ella: si
 * las dos fueran a `bottom-0` la de carrito taparía las cinco pestañas y
 * dejaría al usuario sin forma de moverse por la tienda.
 */
export const CLASE_BARRA_CARRITO_AL_BORDE = 'bottom-0';
export const CLASE_BARRA_CARRITO_SOBRE_NAV =
  'bottom-[calc(50px+env(safe-area-inset-bottom))]';

/**
 * Hueco bajo el pie, para que las barras fijas no le tapen nada.
 *
 * `md:pb-0` porque en escritorio no hay ninguna de las dos barras y el hueco
 * abriría una franja vacía al final de la página.
 */
export const CLASE_HUECO_PIE_SOLO_NAV =
  'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0';
export const CLASE_HUECO_PIE_NAV_Y_CARRITO =
  'pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:pb-0';

/**
 * Hueco al final del contenido de una pantalla sin pie ni navegación inferior
 * (el listado y la ficha), donde la barra de carrito sí llega al borde.
 */
export const CLASE_HUECO_CONTENIDO_SOLO_CARRITO = 'pb-28 md:pb-0';

/**
 * Rutas en las que la barra de carrito acompaña.
 *
 * Es "mientras se navega el catálogo": portada, categorías y listado. La
 * ficha de producto queda fuera a propósito — ya tiene su propia barra fija
 * con el selector de cantidad y el botón de agregar, y apilar dos barras le
 * comería a la ficha un cuarto de la pantalla.
 */
export function esRutaDeCatalogo(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname === '/productos') return true;
  if (pathname === '/categorias' || pathname.startsWith('/categorias/')) return true;
  return false;
}
