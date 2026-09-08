import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SORT_KEY,
  ESTADO_INICIAL,
  PAGE_SIZE,
  applyProductListChange,
  buildPageWindow,
  buildProductListHref,
  buildProductListQuery,
  buildSearchHref,
  parseProductListParams,
  toApiParams,
  type ProductListState,
} from '../product-list-params';

const params = (query: string) => new URLSearchParams(query);

/**
 * Regresiones del listado de productos (`/productos`), las tres que el cliente
 * reportó juntas:
 *
 *  1. El estado del listado vivía en `useState`, no en la URL. Recargar volvía
 *     a la página 1 con el orden por defecto, el enlace que uno comparte no
 *     llevaba a lo que uno estaba viendo, y "atrás" no deshacía ni un filtro.
 *
 *  2. Buscar desde la barra hacía `router.push('/productos?search=...')`, que
 *     reescribe la URL entera y BORRA la categoría y el orden que estuvieran
 *     puestos. El usuario filtraba por "Pinturas", escribía "azul", y acababa
 *     buscando en todo el catálogo sin haber tocado los filtros.
 *
 *  3. El scroll infinito cargaba otra página cada vez que el final entraba en
 *     pantalla, así que el pie de página se alejaba justo al intentar llegar a
 *     él. Se cambió por paginado, y por eso la página es ahora parte del
 *     estado de la URL.
 */
describe('estado del listado de productos en la URL', () => {
  describe('parseProductListParams', () => {
    it('lee búsqueda, categoría, orden y página', () => {
      expect(
        parseProductListParams(
          params('search=pint+azul&categoria=abc-123&orden=price-asc&pagina=3'),
        ),
      ).toEqual({
        search: 'pint azul',
        categoria: 'abc-123',
        sortKey: 'price-asc',
        page: 3,
      });
    });

    it('una URL sin parámetros es el estado inicial', () => {
      expect(parseProductListParams(params(''))).toEqual(ESTADO_INICIAL);
    });

    it('ignora un orden que no existe en vez de romper el listado', () => {
      // La URL la escribe cualquiera; un `orden=inventado` no debe dejar el
      // <select> en un valor que no está entre sus opciones.
      expect(parseProductListParams(params('orden=inventado')).sortKey).toBe(
        DEFAULT_SORT_KEY,
      );
    });

    it('una página que no es un entero positivo cae a la 1', () => {
      // Sin esto, `pagina=0` o `pagina=-2` mandaban un `skip` negativo al
      // backend.
      for (const valor of ['0', '-2', 'abc', '1.5', '']) {
        expect(parseProductListParams(params(`pagina=${valor}`)).page).toBe(1);
      }
    });
  });

  describe('buildProductListQuery', () => {
    it('omite los valores por defecto: /productos sigue siendo /productos', () => {
      expect(buildProductListQuery(ESTADO_INICIAL)).toBe('');
      expect(buildProductListHref(ESTADO_INICIAL)).toBe('/productos');
    });

    it('escribe todo lo que no es el valor por defecto', () => {
      const href = buildProductListHref({
        search: 'pint azul',
        categoria: 'abc-123',
        sortKey: 'price-asc',
        page: 3,
      });

      expect(href).toContain('search=pint+azul');
      expect(href).toContain('categoria=abc-123');
      expect(href).toContain('orden=price-asc');
      expect(href).toContain('pagina=3');
    });

    it('lo que se escribe se vuelve a leer igual (ida y vuelta)', () => {
      // Ésta es la propiedad de la que dependen recargar, "atrás" y compartir
      // el enlace: la URL tiene que ser una representación fiel del estado.
      const estados: ProductListState[] = [
        ESTADO_INICIAL,
        { search: 'pint azul', categoria: null, sortKey: 'name', page: 7 },
        { search: '', categoria: 'uuid-cat', sortKey: DEFAULT_SORT_KEY, page: 2 },
        { search: 'tubo 1/2"', categoria: 'uuid-cat', sortKey: 'price-desc', page: 1 },
      ];

      for (const estado of estados) {
        expect(
          parseProductListParams(params(buildProductListQuery(estado))),
        ).toEqual(estado);
      }
    });
  });

  describe('applyProductListChange', () => {
    const conFiltros: ProductListState = {
      search: '',
      categoria: 'uuid-pinturas',
      sortKey: 'price-asc',
      page: 4,
    };

    it('buscar NO borra la categoría ni el orden', () => {
      const despues = applyProductListChange(conFiltros, { search: 'azul' });

      expect(despues.categoria).toBe('uuid-pinturas');
      expect(despues.sortKey).toBe('price-asc');
      expect(despues.search).toBe('azul');
    });

    it('buscar vuelve a la página 1', () => {
      // Quedarse en la página 4 de un listado que acaba de cambiar de
      // contenido deja al usuario mirando "no hay productos".
      expect(applyProductListChange(conFiltros, { search: 'azul' }).page).toBe(1);
    });

    it('cambiar de categoría o de orden también vuelve a la página 1', () => {
      expect(applyProductListChange(conFiltros, { categoria: 'otra' }).page).toBe(1);
      expect(applyProductListChange(conFiltros, { sortKey: 'name' }).page).toBe(1);
    });

    it('cambiar de página conserva búsqueda, categoría y orden', () => {
      const despues = applyProductListChange(
        { ...conFiltros, search: 'azul' },
        { page: 5 },
      );

      expect(despues).toEqual({
        search: 'azul',
        categoria: 'uuid-pinturas',
        sortKey: 'price-asc',
        page: 5,
      });
    });

    it('volver a buscar lo mismo no tira la página en la que se está', () => {
      expect(applyProductListChange(conFiltros, { search: '' }).page).toBe(4);
    });
  });

  describe('buildSearchHref', () => {
    it('conserva los filtros que ya están en la URL del listado', () => {
      // La regresión textual: antes esto devolvía '/productos?search=azul' a
      // secas y con eso se perdía la categoría "Pinturas".
      const href = buildSearchHref(
        'azul',
        params('categoria=uuid-pinturas&orden=price-asc&pagina=4'),
      );

      expect(href).toContain('categoria=uuid-pinturas');
      expect(href).toContain('orden=price-asc');
      expect(href).toContain('search=azul');
      // Con otro término la página anterior ya no significa nada.
      expect(href).not.toContain('pagina=');
    });

    it('desde fuera del listado lleva al catálogo completo', () => {
      // Buscar desde el navbar en la portada no debe arrastrar parámetros de
      // ninguna otra pantalla.
      expect(buildSearchHref('azul')).toBe('/productos?search=azul');
    });

    it('recorta los espacios de sobra', () => {
      expect(buildSearchHref('  pint azul  ')).toBe('/productos?search=pint+azul');
    });
  });

  describe('toApiParams', () => {
    it('traduce el estado a lo que espera el backend', () => {
      expect(
        toApiParams({
          search: 'pint azul',
          categoria: 'uuid-cat',
          sortKey: 'price-asc',
          page: 3,
        }),
      ).toEqual({
        page: 3,
        limit: PAGE_SIZE,
        search: 'pint azul',
        categoryUuid: 'uuid-cat',
        sortBy: 'price',
        sortOrder: 'ASC',
      });
    });

    it('no manda búsqueda ni categoría vacías', () => {
      const enviado = toApiParams(ESTADO_INICIAL);

      expect(enviado.search).toBeUndefined();
      expect(enviado.categoryUuid).toBeUndefined();
    });
  });

  describe('buildPageWindow', () => {
    it('con pocas páginas las muestra todas', () => {
      expect(buildPageWindow(1, 3)).toEqual([1, 2, 3]);
    });

    it('no pinta nada cuando sólo hay una página', () => {
      expect(buildPageWindow(1, 1)).toEqual([1]);
      expect(buildPageWindow(1, 0)).toEqual([]);
    });

    it('con 91 páginas (1089 productos, 12 por página) no las pinta todas', () => {
      const ventana = buildPageWindow(45, 91);

      expect(ventana).toEqual([1, null, 44, 45, 46, null, 91]);
    });

    it('siempre incluye la primera, la última y la actual', () => {
      for (const actual of [1, 2, 50, 90, 91]) {
        const ventana = buildPageWindow(actual, 91);

        expect(ventana[0]).toBe(1);
        expect(ventana[ventana.length - 1]).toBe(91);
        expect(ventana).toContain(actual);
      }
    });

    it('no repite números ni deja un "…" tapando una sola página', () => {
      const ventana = buildPageWindow(3, 91);

      expect(ventana).toEqual([1, 2, 3, 4, null, 91]);
    });
  });
});
