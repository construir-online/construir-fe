/**
 * Estado del listado de productos, guardado en los query params de la URL.
 *
 * Antes este estado vivía en `useState` dentro de `/productos`, y eso rompía
 * cuatro cosas que el cliente reportó como una sola ("se me pierde lo que
 * estaba viendo"):
 *
 *  - Buscar desde la barra hacía `router.push('/productos?search=...')`, que
 *    reescribe la URL entera y por tanto BORRA la categoría que estuviera
 *    elegida. El usuario filtraba por "Pinturas", escribía "azul" y se
 *    encontraba buscando en todo el catálogo.
 *  - El orden y la página no salían en la URL, así que el enlace que uno
 *    comparte no lleva a lo mismo que uno está viendo.
 *  - Recargar devolvía siempre a la página 1 con el orden por defecto.
 *  - El botón "atrás" del navegador no deshacía ni un filtro ni una búsqueda.
 *
 * Este módulo es la única fuente de verdad de cómo se escribe y cómo se lee
 * ese estado, para que la página del listado y la barra de búsqueda no puedan
 * discrepar.
 */

export interface SortOption {
  key: string;
  label: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export const SORT_OPTIONS: SortOption[] = [
  { key: 'relevance', label: 'Relevancia', sortBy: 'createdAt', sortOrder: 'DESC' },
  { key: 'price-asc', label: 'Menor precio', sortBy: 'price', sortOrder: 'ASC' },
  { key: 'price-desc', label: 'Mayor precio', sortBy: 'price', sortOrder: 'DESC' },
  { key: 'name', label: 'Nombre A–Z', sortBy: 'name', sortOrder: 'ASC' },
];

export const DEFAULT_SORT_KEY = SORT_OPTIONS[0].key;

/** Cuántos productos entran en una página del listado. */
export const PAGE_SIZE = 12;

/**
 * Nombres de los parámetros. `categoria` y `search` se mantienen tal cual
 * estaban porque ya hay enlaces publicados (el menú de categorías, los chips y
 * lo que la gente tenga guardado) que los usan con ese nombre.
 */
export const PARAM_BUSQUEDA = 'search';
export const PARAM_CATEGORIA = 'categoria';
export const PARAM_ORDEN = 'orden';
export const PARAM_PAGINA = 'pagina';
export const PARAM_PRECIO_MIN = 'precioMin';
export const PARAM_PRECIO_MAX = 'precioMax';
export const PARAM_STOCK = 'stock';

/**
 * Unidades a partir de las cuales un producto deja de ser "últimas unidades".
 *
 * Es el mismo 5 con el que la ficha y la tarjeta ya pintan el aviso naranja de
 * stock bajo. Se comparte para que el filtro y el aviso no puedan decir cosas
 * distintas del mismo producto.
 */
export const UMBRAL_STOCK_BAJO = 5;

/** Valor del parámetro `stock` que pide sólo productos con varias unidades. */
export const STOCK_VARIAS_UNIDADES = 'varias';

/**
 * Rangos del filtro de precio, en **USD con IVA**.
 *
 * Van en dólares aunque la pantalla enseñe los bolívares en grande: el precio
 * en Bs. se deriva de la tasa BCV, que cambia todos los días, así que un
 * enlace con "de Bs. 1.000 a Bs. 2.000" compartido por WhatsApp seleccionaría
 * otros productos mañana sin que nadie hubiera tocado el catálogo. La etiqueta
 * se pinta en las dos monedas con la tasa del momento; lo que viaja en la URL
 * es el dólar, que no se mueve.
 *
 * Los cortes salen de la distribución real del catálogo (mediana ~$9, tres
 * cuartas partes por debajo de $28), no de números redondos inventados: con
 * cortes en $100 o $500 tres de los cuatro rangos habrían salido vacíos.
 */
export interface RangoDePrecio {
  key: string;
  min: number | null;
  max: number | null;
}

export const RANGOS_DE_PRECIO: RangoDePrecio[] = [
  { key: 'hasta-5', min: null, max: 5 },
  { key: '5-20', min: 5, max: 20 },
  { key: '20-50', min: 20, max: 50 },
  { key: 'desde-50', min: 50, max: null },
];

export interface ProductListState {
  search: string;
  /** uuid de la categoría, o `null` para "todos los productos". */
  categoria: string | null;
  sortKey: string;
  page: number;
  /** Precio mínimo en USD con IVA, o `null` si no hay tope inferior. */
  precioMin: number | null;
  /** Precio máximo en USD con IVA, o `null` si no hay tope superior. */
  precioMax: number | null;
  /**
   * Sólo productos con más de `UMBRAL_STOCK_BAJO` unidades.
   *
   * No es un "sólo disponibles": el catálogo público ya esconde lo agotado, o
   * sea que ese filtro no quitaría ni un producto. Lo que sí cambia la lista es
   * cuánto hay — quien compra para una obra se lleva varias unidades y un
   * renglón con tres no le sirve.
   */
  stockAmplio: boolean;
}

export const ESTADO_INICIAL: ProductListState = {
  search: '',
  categoria: null,
  sortKey: DEFAULT_SORT_KEY,
  page: 1,
  precioMin: null,
  precioMax: null,
  stockAmplio: false,
};

/** Sólo lo que se puede leer de una URL; `URLSearchParams` y el de Next encajan. */
export interface ReadableParams {
  get(name: string): string | null;
}

function parsePagina(valor: string | null): number {
  const numero = Number(valor);
  // Una página que no es un entero positivo (0, -3, "abc", 1.5) no existe: se
  // trata como la primera en vez de mandarle al backend un `skip` negativo.
  if (!Number.isInteger(numero) || numero < 1) return 1;
  return numero;
}

/**
 * Lee el estado del listado desde los query params.
 *
 * Todo valor que no se entienda cae al valor por defecto: la URL la escribe
 * cualquiera y una URL a mano nunca debe dejar la pantalla rota.
 */
export function parseProductListParams(
  params: ReadableParams,
): ProductListState {
  const sortKey = params.get(PARAM_ORDEN);
  const precioMin = parsePrecio(params.get(PARAM_PRECIO_MIN));
  const precioMax = parsePrecio(params.get(PARAM_PRECIO_MAX));

  return {
    search: params.get(PARAM_BUSQUEDA)?.trim() ?? '',
    categoria: params.get(PARAM_CATEGORIA) || null,
    sortKey: SORT_OPTIONS.some((opcion) => opcion.key === sortKey)
      ? (sortKey as string)
      : DEFAULT_SORT_KEY,
    page: parsePagina(params.get(PARAM_PAGINA)),
    // Un rango al revés (`precioMin=50&precioMax=20`) no devuelve nada nunca y
    // no hay forma de llegar a él desde la pantalla: si aparece es una URL
    // editada a mano o un enlace roto, y se descarta entero en vez de dejar al
    // usuario ante un "no hay productos" que no puede deshacer con ningún
    // control visible.
    precioMin: rangoAlReves(precioMin, precioMax) ? null : precioMin,
    precioMax: rangoAlReves(precioMin, precioMax) ? null : precioMax,
    stockAmplio: params.get(PARAM_STOCK) === STOCK_VARIAS_UNIDADES,
  };
}

/**
 * Lee un precio de la URL. Todo lo que no sea un número finito y no negativo
 * (`abc`, `-5`, vacío, ausente) se trata como "sin filtro": la URL la escribe
 * cualquiera y nunca debe dejar la pantalla rota.
 */
function parsePrecio(valor: string | null): number | null {
  if (valor === null || valor.trim() === '') return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return numero;
}

function rangoAlReves(min: number | null, max: number | null): boolean {
  return min !== null && max !== null && min > max;
}

/**
 * Escribe el estado como query string.
 *
 * Los valores por defecto se omiten para que la URL de "todo el catálogo" siga
 * siendo `/productos` a secas y no `/productos?search=&orden=relevance&pagina=1`.
 */
export function buildProductListQuery(estado: ProductListState): string {
  const params = new URLSearchParams();

  if (estado.search.trim()) params.set(PARAM_BUSQUEDA, estado.search.trim());
  if (estado.categoria) params.set(PARAM_CATEGORIA, estado.categoria);
  if (estado.sortKey !== DEFAULT_SORT_KEY) params.set(PARAM_ORDEN, estado.sortKey);
  if (estado.precioMin !== null) params.set(PARAM_PRECIO_MIN, String(estado.precioMin));
  if (estado.precioMax !== null) params.set(PARAM_PRECIO_MAX, String(estado.precioMax));
  if (estado.stockAmplio) params.set(PARAM_STOCK, STOCK_VARIAS_UNIDADES);
  // La página va la última para que la parte "qué estoy viendo" de la URL no
  // cambie de forma al pasar de página.
  if (estado.page > 1) params.set(PARAM_PAGINA, String(estado.page));

  return params.toString();
}

/** La ruta completa (`/productos?...`) para un estado dado. */
export function buildProductListHref(estado: ProductListState): string {
  const query = buildProductListQuery(estado);
  return query ? `/productos?${query}` : '/productos';
}

/**
 * Aplica un cambio parcial sobre el estado actual.
 *
 * Cambiar la búsqueda, la categoría o el orden vuelve a la página 1 — quedarse
 * en la página 7 de un listado que acaba de cambiar de contenido deja al
 * usuario mirando "no hay productos" sin entender por qué. Cambiar de página,
 * en cambio, respeta todo lo demás: aquí es donde antes se perdían los filtros.
 */
export function applyProductListChange(
  actual: ProductListState,
  cambio: Partial<ProductListState>,
): ProductListState {
  const siguiente = { ...actual, ...cambio };
  const cambiaElListado =
    (cambio.search !== undefined && cambio.search !== actual.search) ||
    (cambio.categoria !== undefined && cambio.categoria !== actual.categoria) ||
    (cambio.sortKey !== undefined && cambio.sortKey !== actual.sortKey) ||
    // Los filtros son una dimensión más del mismo estado: cambiar el precio o
    // el stock cambia el contenido de la lista igual que cambiar de categoría,
    // así que también devuelven a la página 1. Sin esto, filtrar estando en la
    // página 7 de 90 dejaba al usuario ante un "esta página ya no existe".
    (cambio.precioMin !== undefined && cambio.precioMin !== actual.precioMin) ||
    (cambio.precioMax !== undefined && cambio.precioMax !== actual.precioMax) ||
    (cambio.stockAmplio !== undefined && cambio.stockAmplio !== actual.stockAmplio);

  if (cambiaElListado && cambio.page === undefined) {
    siguiente.page = 1;
  }

  return siguiente;
}

/**
 * Href para buscar `termino` CONSERVANDO los filtros que ya estén puestos.
 *
 * Ésta es la regresión concreta de la barra de búsqueda: hacía
 * `router.push('/productos?search=' + termino)` y con eso tiraba la categoría
 * y el orden. Desde fuera del listado (`paramsActuales` vacío) el resultado es
 * el mismo de antes, así que buscar desde el navbar en cualquier otra pantalla
 * sigue llevando al catálogo completo filtrado sólo por el término.
 */
export function buildSearchHref(
  termino: string,
  paramsActuales?: ReadableParams,
): string {
  const base = paramsActuales
    ? parseProductListParams(paramsActuales)
    : ESTADO_INICIAL;

  return buildProductListHref(
    applyProductListChange(base, { search: termino.trim() }),
  );
}

/**
 * Href para filtrar por `categoriaUuid` CONSERVANDO la búsqueda y el orden.
 *
 * Hermana de `buildSearchHref`, y la otra mitad del mismo requisito. El menú
 * lateral y los chips enlazaban a `/productos?categoria=X` a pelo, o sea que
 * reescribían la URL entera: estando en `?categoria=PINTURA&search=azul&
 * orden=price-asc` con 23 productos, un clic en "ABRASIVOS" dejaba la URL en
 * `/productos?categoria=…` a secas — 54 productos, el orden vuelto a
 * "Relevancia" y la búsqueda desaparecida. Y como el menú y los chips son *el*
 * camino para cambiar de categoría en esa pantalla, el cliente que filtraba y
 * luego cambiaba de categoría seguía viendo el síntoma original.
 *
 * `null` como categoría es el enlace de "Todos los productos": quita el filtro
 * de categoría y sólo ése. Quien busca "azul" y pulsa "Todos los productos"
 * está ampliando la categoría, no cancelando su búsqueda.
 *
 * Se vuelve a la página 1 porque el listado cambia de contenido, igual que al
 * buscar o al cambiar el orden.
 *
 * Sin `paramsActuales` devuelve el enlace de siempre (`/productos?categoria=X`).
 * Eso es lo que se quiere fuera del listado: los chips y el menú se pintan
 * también en otras pantallas, y allí los query params son de esa otra pantalla
 * — arrastrarlos al catálogo metería basura en la URL.
 */
export function buildCategoryHref(
  categoriaUuid: string | null,
  paramsActuales?: ReadableParams,
): string {
  const base = paramsActuales
    ? parseProductListParams(paramsActuales)
    : ESTADO_INICIAL;

  return buildProductListHref(
    applyProductListChange(base, { categoria: categoriaUuid }),
  );
}

/** Los parámetros que espera el backend para este estado. */
export function toApiParams(estado: ProductListState) {
  const sort =
    SORT_OPTIONS.find((opcion) => opcion.key === estado.sortKey) ?? SORT_OPTIONS[0];

  return {
    page: estado.page,
    limit: PAGE_SIZE,
    search: estado.search || undefined,
    categoryUuid: estado.categoria || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    minPrice: estado.precioMin ?? undefined,
    maxPrice: estado.precioMax ?? undefined,
    // El backend recibe un número de unidades, no un "sí/no": así el umbral
    // vive en un solo sitio de este lado y la API sigue sirviendo para
    // cualquier otro corte que haga falta más adelante.
    minInventory: estado.stockAmplio ? UMBRAL_STOCK_BAJO + 1 : undefined,
  };
}

/**
 * Href que aplica (o quita) un rango de precio CONSERVANDO todo lo demás.
 *
 * Es la misma regla que `buildSearchHref` y `buildCategoryHref`: los filtros
 * son una dimensión más del estado del listado, no un sistema aparte. Quien
 * está en "Pinturas", buscando "azul", ordenado por menor precio, y toca "de
 * $5 a $20", tiene que seguir en Pinturas, buscando azul y con ese orden.
 *
 * `null` en los dos extremos es el enlace de "cualquier precio": quita el
 * rango y sólo el rango.
 */
export function buildPriceHref(
  min: number | null,
  max: number | null,
  paramsActuales?: ReadableParams,
): string {
  const base = paramsActuales
    ? parseProductListParams(paramsActuales)
    : ESTADO_INICIAL;

  return buildProductListHref(
    applyProductListChange(base, { precioMin: min, precioMax: max }),
  );
}

/** Href que enciende o apaga el filtro de stock, conservando todo lo demás. */
export function buildStockHref(
  stockAmplio: boolean,
  paramsActuales?: ReadableParams,
): string {
  const base = paramsActuales
    ? parseProductListParams(paramsActuales)
    : ESTADO_INICIAL;

  return buildProductListHref(applyProductListChange(base, { stockAmplio }));
}

/**
 * Href que quita TODOS los filtros pero deja la búsqueda y la categoría.
 *
 * "Limpiar filtros" no es "empezar de cero": quien buscó "cemento" dentro de
 * "Obra gris" y luego pulsa limpiar está ampliando el precio y el stock, no
 * cancelando su búsqueda. Borrarle también el término era el mismo error que
 * ya se pagó con la barra de búsqueda.
 */
export function buildClearFiltersHref(paramsActuales?: ReadableParams): string {
  const base = paramsActuales
    ? parseProductListParams(paramsActuales)
    : ESTADO_INICIAL;

  return buildProductListHref(
    applyProductListChange(base, {
      precioMin: null,
      precioMax: null,
      stockAmplio: false,
    }),
  );
}

/** Cuántos filtros hay puestos, para el contador del botón "Filtros". */
export function contarFiltrosActivos(estado: ProductListState): number {
  const rangoPuesto = estado.precioMin !== null || estado.precioMax !== null;
  return (rangoPuesto ? 1 : 0) + (estado.stockAmplio ? 1 : 0);
}

/** El rango de `RANGOS_DE_PRECIO` que corresponde al estado, si hay alguno. */
export function rangoActivo(estado: ProductListState): RangoDePrecio | null {
  return (
    RANGOS_DE_PRECIO.find(
      (rango) =>
        rango.min === estado.precioMin && rango.max === estado.precioMax,
    ) ?? null
  );
}

/**
 * Números de página a mostrar en el paginador, con `null` donde va un "…".
 *
 * Con 1089 productos y 12 por página hay más de 90 páginas: pintarlas todas no
 * cabe en un teléfono. Se muestran siempre la primera, la última y las vecinas
 * de la actual.
 */
export function buildPageWindow(
  paginaActual: number,
  ultimaPagina: number,
  vecinas = 1,
): (number | null)[] {
  if (ultimaPagina <= 1) return ultimaPagina === 1 ? [1] : [];

  const visibles = new Set<number>([1, ultimaPagina]);
  for (let p = paginaActual - vecinas; p <= paginaActual + vecinas; p++) {
    if (p >= 1 && p <= ultimaPagina) visibles.add(p);
  }

  const ordenadas = [...visibles].sort((a, b) => a - b);
  const resultado: (number | null)[] = [];

  ordenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - ordenadas[indice - 1] > 1) resultado.push(null);
    resultado.push(pagina);
  });

  return resultado;
}
