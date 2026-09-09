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

export interface ProductListState {
  search: string;
  /** uuid de la categoría, o `null` para "todos los productos". */
  categoria: string | null;
  sortKey: string;
  page: number;
}

export const ESTADO_INICIAL: ProductListState = {
  search: '',
  categoria: null,
  sortKey: DEFAULT_SORT_KEY,
  page: 1,
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

  return {
    search: params.get(PARAM_BUSQUEDA)?.trim() ?? '',
    categoria: params.get(PARAM_CATEGORIA) || null,
    sortKey: SORT_OPTIONS.some((opcion) => opcion.key === sortKey)
      ? (sortKey as string)
      : DEFAULT_SORT_KEY,
    page: parsePagina(params.get(PARAM_PAGINA)),
  };
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
    (cambio.sortKey !== undefined && cambio.sortKey !== actual.sortKey);

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
  };
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
