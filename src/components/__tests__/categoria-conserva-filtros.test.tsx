import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Category } from '@/types';
import CategoryChips from '../CategoryChips';
import { CategoryMenu } from '../CategoryMenu';
import { buildCategoryHref } from '@/lib/product-list-params';

/**
 * Regresión: cambiar de categoría descartaba la búsqueda y el orden.
 *
 * El menú lateral y los chips enlazaban a `/productos?categoria=X` a pelo, o
 * sea que reescribían la URL entera. Reproducido en navegador: estando en
 * `?categoria=PINTURA&search=azul&orden=price-asc` con 23 productos, un clic
 * en "ABRASIVOS" dejaba la URL en `/productos?categoria=…` a secas — 54
 * productos, el orden vuelto a "Relevancia" y la búsqueda desaparecida.
 *
 * Es la otra mitad del mismo requisito que arregló `buildSearchHref` (buscar
 * ya no borraba la categoría): el menú y los chips son *el* camino para
 * cambiar de categoría en esa pantalla, así que el cliente que filtraba y
 * luego cambiaba de categoría seguía viendo el síntoma original.
 */

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

let paramsActuales = new URLSearchParams();
let rutaActual = '/productos';
vi.mock('next/navigation', () => ({
  useSearchParams: () => paramsActuales,
  usePathname: () => rutaActual,
}));

const getCategorias = vi.fn();
vi.mock('@/services/categories', () => ({
  categoriesService: {
    getFeatured: () => getCategorias(),
    getVisible: () => getCategorias(),
  },
}));

const categoria = (uuid: string, name: string): Category =>
  ({
    uuid,
    name,
    slug: name.toLowerCase(),
    order: 0,
    visible: true,
    isFeatured: true,
  }) as Category;

const PINTURA = categoria('uuid-pintura', 'PINTURAS');
const ABRASIVOS = categoria('uuid-abrasivos', 'ABRASIVOS');

/** El escenario del revisor: filtrando por PINTURAS, buscando "azul", por precio. */
const ESCENARIO_DEL_REVISOR =
  'categoria=uuid-pintura&search=azul&orden=price-asc&pagina=2';

beforeEach(() => {
  vi.clearAllMocks();
  getCategorias.mockResolvedValue([PINTURA, ABRASIVOS]);
  paramsActuales = new URLSearchParams();
  rutaActual = '/productos';
});

// El primer render del fichero paga el arranque en frío de jsdom + React.
vi.setConfig({ testTimeout: 30000 });

/** El href del enlace de una categoría, tal como quedaría en el DOM. */
const hrefDe = async (nombre: string) => {
  const enlace = await screen.findByRole('link', { name: new RegExp(nombre) });
  return enlace.getAttribute('href')!;
};

describe('cambiar de categoría desde los chips', () => {
  it('conserva la búsqueda y el orden (el caso del revisor)', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryChips />);

    const href = await hrefDe('ABRASIVOS');

    // Antes esto era `/productos?categoria=uuid-abrasivos` a secas.
    expect(href).toContain('categoria=uuid-abrasivos');
    expect(href).toContain('search=azul');
    expect(href).toContain('orden=price-asc');
  });

  it('vuelve a la página 1: el listado cambia de contenido', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryChips />);

    // Quedarse en la página 2 de un listado que acaba de cambiar deja al
    // usuario mirando "no hay productos" sin entender por qué.
    expect(await hrefDe('ABRASIVOS')).not.toContain('pagina=');
  });

  it('"Todos los productos" quita la categoría y sólo la categoría', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryChips />);

    const href = await hrefDe('allProducts');

    // Quien busca "azul" y pulsa "Todos los productos" está ampliando la
    // categoría, no cancelando su búsqueda.
    expect(href).not.toContain('categoria=');
    expect(href).toContain('search=azul');
    expect(href).toContain('orden=price-asc');
  });

  it('sin filtros puestos el enlace es el de siempre', async () => {
    render(<CategoryChips />);

    expect(await hrefDe('ABRASIVOS')).toBe('/productos?categoria=uuid-abrasivos');
  });

  it('fuera del listado NO arrastra los query params de esa otra pantalla', async () => {
    // Los chips se pintan también en la portada y en otras pantallas, donde
    // `?search=` o `?orden=` no significan lo mismo (o son basura de otra ruta).
    rutaActual = '/';
    paramsActuales = new URLSearchParams('search=loquesea&orden=price-asc');
    render(<CategoryChips />);

    expect(await hrefDe('ABRASIVOS')).toBe('/productos?categoria=uuid-abrasivos');
  });

  it('siguen siendo <Link> de verdad, abribles en pestaña nueva', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryChips />);

    const enlace = await screen.findByRole('link', { name: /ABRASIVOS/ });
    // Un <a href> real: se puede abrir en otra pestaña y el navegador enseña
    // el destino en la barra de estado. Un onClick no daría ninguna de las dos.
    expect(enlace.tagName).toBe('A');
    expect(enlace.getAttribute('href')).toBeTruthy();
  });
});

describe('cambiar de categoría desde el menú lateral', () => {
  it('conserva la búsqueda y el orden', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryMenu />);

    const href = await hrefDe('ABRASIVOS');

    expect(href).toContain('categoria=uuid-abrasivos');
    expect(href).toContain('search=azul');
    expect(href).toContain('orden=price-asc');
    expect(href).not.toContain('pagina=');
  });

  it('"Todos los productos" conserva la búsqueda y el orden', async () => {
    paramsActuales = new URLSearchParams(ESCENARIO_DEL_REVISOR);
    render(<CategoryMenu />);

    const href = await hrefDe('Todos los productos');

    expect(href).not.toContain('categoria=');
    expect(href).toContain('search=azul');
  });

  it('fuera del listado NO arrastra los query params de esa otra pantalla', async () => {
    rutaActual = '/carrito';
    paramsActuales = new URLSearchParams('search=loquesea');
    render(<CategoryMenu />);

    expect(await hrefDe('ABRASIVOS')).toBe('/productos?categoria=uuid-abrasivos');
  });
});

/**
 * El helper es el mismo que usan los dos componentes, así que aquí se fija su
 * contrato una sola vez.
 */
describe('buildCategoryHref', () => {
  const params = (q: string) => new URLSearchParams(q);

  it('conserva búsqueda y orden, y vuelve a la página 1', () => {
    expect(
      buildCategoryHref('uuid-abrasivos', params(ESCENARIO_DEL_REVISOR)),
    ).toBe('/productos?search=azul&categoria=uuid-abrasivos&orden=price-asc');
  });

  it('con null quita la categoría y deja lo demás', () => {
    expect(buildCategoryHref(null, params(ESCENARIO_DEL_REVISOR))).toBe(
      '/productos?search=azul&orden=price-asc',
    );
  });

  it('sin params actuales devuelve el enlace de siempre', () => {
    expect(buildCategoryHref('uuid-abrasivos')).toBe(
      '/productos?categoria=uuid-abrasivos',
    );
    expect(buildCategoryHref(null)).toBe('/productos');
  });

  it('quedarse en la misma categoría no tira la página en la que se está', () => {
    // No cambia el listado, así que no hay razón para devolver a la página 1.
    expect(
      buildCategoryHref('uuid-pintura', params(ESCENARIO_DEL_REVISOR)),
    ).toContain('pagina=2');
  });
});
