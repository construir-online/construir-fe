import { describe, it, expect } from 'vitest';
import {
  RANGOS_DE_PRECIO,
  STOCK_VARIAS_UNIDADES,
  UMBRAL_STOCK_BAJO,
  applyProductListChange,
  buildCategoryHref,
  buildClearFiltersHref,
  buildPriceHref,
  buildProductListHref,
  buildSearchHref,
  buildStockHref,
  contarFiltrosActivos,
  parseProductListParams,
  rangoActivo,
  toApiParams,
} from '../product-list-params';

const params = (query: string) => new URLSearchParams(query);

/**
 * Filtros de precio y de disponibilidad del listado.
 *
 * Los filtros NO son un sistema aparte: son una dimensión más del mismo estado
 * que ya vivía en la URL junto a la búsqueda, la categoría, el orden y la
 * página. Casi todo lo que hay acá comprueba esa frase, porque la regresión
 * que más duele en esta pantalla — y que ya se pagó una vez con la barra de
 * búsqueda — es exactamente ésa: un control que reescribe la URL entera y con
 * ella tira por la borda lo que el usuario venía haciendo.
 */
describe('filtros del listado', () => {
  describe('lectura desde la URL', () => {
    it('lee el rango de precio y el filtro de stock', () => {
      const estado = parseProductListParams(
        params('precioMin=5&precioMax=20&stock=varias'),
      );

      expect(estado.precioMin).toBe(5);
      expect(estado.precioMax).toBe(20);
      expect(estado.stockAmplio).toBe(true);
    });

    it('sin filtros en la URL, no hay filtros puestos', () => {
      const estado = parseProductListParams(params('search=cemento'));

      expect(estado.precioMin).toBeNull();
      expect(estado.precioMax).toBeNull();
      expect(estado.stockAmplio).toBe(false);
      expect(contarFiltrosActivos(estado)).toBe(0);
    });

    // La URL la escribe cualquiera y una URL a mano nunca debe dejar la
    // pantalla rota ni sin salida.
    it.each([
      ['precioMin=abc', 'texto'],
      ['precioMin=-5', 'negativo'],
      ['precioMin=', 'vacío'],
    ])('descarta un precio %s (%s)', (query) => {
      expect(parseProductListParams(params(query)).precioMin).toBeNull();
    });

    it('descarta el rango entero si viene al revés', () => {
      const estado = parseProductListParams(params('precioMin=50&precioMax=20'));

      // Un rango invertido no devuelve nada nunca, y no hay ningún control en
      // la pantalla que pueda producirlo ni deshacerlo: el usuario se quedaría
      // ante un "no hay productos" sin botón que tocar.
      expect(estado.precioMin).toBeNull();
      expect(estado.precioMax).toBeNull();
    });

    it('sólo `stock=varias` enciende el filtro de stock', () => {
      expect(parseProductListParams(params('stock=true')).stockAmplio).toBe(false);
      expect(parseProductListParams(params('stock=si')).stockAmplio).toBe(false);
      expect(
        parseProductListParams(params(`stock=${STOCK_VARIAS_UNIDADES}`)).stockAmplio,
      ).toBe(true);
    });
  });

  describe('escritura en la URL', () => {
    it('un listado sin filtros no arrastra parámetros vacíos', () => {
      expect(buildProductListHref(parseProductListParams(params('')))).toBe(
        '/productos',
      );
    });

    it('ida y vuelta: lo escrito se vuelve a leer igual', () => {
      const original = parseProductListParams(
        params('search=azul&categoria=abc&orden=price-asc&precioMin=5&precioMax=20&stock=varias&pagina=3'),
      );
      const href = buildProductListHref(original);

      expect(parseProductListParams(params(href.split('?')[1]))).toEqual(original);
    });
  });

  /**
   * El corazón del asunto. Cada uno de estos casos es un control real de la
   * pantalla, y todos tienen que conservar lo que no tocan.
   */
  describe('los filtros conviven con el resto del estado de la URL', () => {
    const urlCompleta = params(
      'search=azul&categoria=PINTURAS&orden=price-asc&precioMin=5&precioMax=20&stock=varias&pagina=7',
    );

    it('poner un rango de precio conserva búsqueda, categoría y orden', () => {
      const href = buildPriceHref(20, 50, urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.search).toBe('azul');
      expect(resultado.categoria).toBe('PINTURAS');
      expect(resultado.sortKey).toBe('price-asc');
      expect(resultado.stockAmplio).toBe(true);
      expect(resultado.precioMin).toBe(20);
      expect(resultado.precioMax).toBe(50);
    });

    it('apagar el filtro de stock conserva búsqueda, categoría, orden y precio', () => {
      const href = buildStockHref(false, urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.search).toBe('azul');
      expect(resultado.categoria).toBe('PINTURAS');
      expect(resultado.sortKey).toBe('price-asc');
      expect(resultado.precioMin).toBe(5);
      expect(resultado.precioMax).toBe(20);
      expect(resultado.stockAmplio).toBe(false);
    });

    it('buscar conserva los filtros que ya estaban puestos', () => {
      const href = buildSearchHref('cemento', urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.search).toBe('cemento');
      expect(resultado.precioMin).toBe(5);
      expect(resultado.precioMax).toBe(20);
      expect(resultado.stockAmplio).toBe(true);
      expect(resultado.categoria).toBe('PINTURAS');
    });

    it('cambiar de categoría conserva los filtros que ya estaban puestos', () => {
      const href = buildCategoryHref('ABRASIVOS', urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.categoria).toBe('ABRASIVOS');
      expect(resultado.precioMin).toBe(5);
      expect(resultado.precioMax).toBe(20);
      expect(resultado.stockAmplio).toBe(true);
      expect(resultado.search).toBe('azul');
    });

    it('"Todos los productos" conserva los filtros y sólo quita la categoría', () => {
      const href = buildCategoryHref(null, urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.categoria).toBeNull();
      expect(resultado.precioMin).toBe(5);
      expect(resultado.stockAmplio).toBe(true);
      expect(resultado.search).toBe('azul');
    });

    it('cambiar de página conserva los filtros', () => {
      const estado = parseProductListParams(urlCompleta);
      const href = buildProductListHref({ ...estado, page: 8 });
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.page).toBe(8);
      expect(resultado.precioMin).toBe(5);
      expect(resultado.precioMax).toBe(20);
      expect(resultado.stockAmplio).toBe(true);
    });

    /**
     * "Limpiar filtros" no es "empezar de cero". Quien buscó "azul" dentro de
     * "Pinturas" y luego limpia está ampliando el precio y el stock, no
     * cancelando su búsqueda — borrarle el término sería el mismo error que ya
     * se pagó con la barra de búsqueda.
     */
    it('limpiar filtros deja la búsqueda, la categoría y el orden', () => {
      const href = buildClearFiltersHref(urlCompleta);
      const resultado = parseProductListParams(params(href.split('?')[1]));

      expect(resultado.precioMin).toBeNull();
      expect(resultado.precioMax).toBeNull();
      expect(resultado.stockAmplio).toBe(false);
      expect(resultado.search).toBe('azul');
      expect(resultado.categoria).toBe('PINTURAS');
      expect(resultado.sortKey).toBe('price-asc');
    });
  });

  /**
   * Filtrar cambia el contenido de la lista, así que devuelve a la página 1 —
   * igual que buscar, cambiar de categoría o cambiar el orden. Sin esto,
   * filtrar desde la página 7 de 90 dejaba al usuario ante "esta página ya no
   * existe" sin entender qué había hecho mal.
   */
  describe('filtrar vuelve a la página 1', () => {
    const enLaPagina7 = parseProductListParams(params('pagina=7'));

    it.each([
      ['precio mínimo', { precioMin: 5 }],
      ['precio máximo', { precioMax: 20 }],
      ['stock', { stockAmplio: true }],
    ])('al cambiar el filtro de %s', (_nombre, cambio) => {
      expect(applyProductListChange(enLaPagina7, cambio).page).toBe(1);
    });

    it('pero no si el filtro se "cambia" al mismo valor que ya tenía', () => {
      const conFiltro = parseProductListParams(params('precioMin=5&pagina=7'));

      expect(applyProductListChange(conFiltro, { precioMin: 5 }).page).toBe(7);
    });

    it('y cambiar de página sigue respetando la página pedida', () => {
      const conFiltro = parseProductListParams(params('precioMin=5&pagina=7'));

      expect(applyProductListChange(conFiltro, { page: 8 }).page).toBe(8);
    });

    it('los enlaces de filtro llevan siempre a la página 1', () => {
      const desdeLa7 = params('precioMin=5&pagina=7');

      expect(buildPriceHref(20, 50, desdeLa7)).not.toContain('pagina');
      expect(buildStockHref(true, desdeLa7)).not.toContain('pagina');
      expect(buildClearFiltersHref(desdeLa7)).not.toContain('pagina');
    });
  });

  describe('lo que se le pide al backend', () => {
    it('traduce el rango y el stock a los parámetros de la API', () => {
      const api = toApiParams(
        parseProductListParams(params('precioMin=5&precioMax=20&stock=varias')),
      );

      expect(api.minPrice).toBe(5);
      expect(api.maxPrice).toBe(20);
      // El backend recibe un número de unidades, no un sí/no: el umbral vive
      // en un único sitio de este lado.
      expect(api.minInventory).toBe(UMBRAL_STOCK_BAJO + 1);
    });

    it('no manda los filtros que no están puestos', () => {
      const api = toApiParams(parseProductListParams(params('search=cemento')));

      expect(api.minPrice).toBeUndefined();
      expect(api.maxPrice).toBeUndefined();
      expect(api.minInventory).toBeUndefined();
    });

    it('el filtro de stock no se lleva por delante los otros parámetros', () => {
      const api = toApiParams(
        parseProductListParams(params('search=azul&categoria=abc&stock=varias&pagina=3')),
      );

      expect(api.search).toBe('azul');
      expect(api.categoryUuid).toBe('abc');
      expect(api.page).toBe(3);
      expect(api.minInventory).toBe(UMBRAL_STOCK_BAJO + 1);
    });
  });

  describe('contador y rango activo, que es lo que pinta la pantalla', () => {
    it('cuenta el rango de precio como UN filtro, no como dos', () => {
      const estado = parseProductListParams(params('precioMin=5&precioMax=20'));

      expect(contarFiltrosActivos(estado)).toBe(1);
    });

    it('cuenta precio y stock por separado', () => {
      expect(
        contarFiltrosActivos(
          parseProductListParams(params('precioMin=5&precioMax=20&stock=varias')),
        ),
      ).toBe(2);
    });

    it('un rango abierto por un extremo también cuenta', () => {
      expect(contarFiltrosActivos(parseProductListParams(params('precioMax=5')))).toBe(1);
      expect(contarFiltrosActivos(parseProductListParams(params('precioMin=50')))).toBe(1);
    });

    it('reconoce cada rango del panel a partir de la URL que él mismo genera', () => {
      RANGOS_DE_PRECIO.forEach((rango) => {
        const href = buildPriceHref(rango.min, rango.max);
        const estado = parseProductListParams(params(href.split('?')[1] ?? ''));

        expect(rangoActivo(estado)?.key).toBe(rango.key);
      });
    });

    it('un rango a medida que no está en el panel no marca ninguna opción', () => {
      expect(rangoActivo(parseProductListParams(params('precioMin=7&precioMax=13')))).toBeNull();
    });
  });
});
