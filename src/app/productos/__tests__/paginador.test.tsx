import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import ProductsPage from '../page';
import type { Product } from '@/types';

/**
 * Regresión encontrada en la revisión, y el hueco de pruebas por el que se
 * coló: el paginador entero estaba dentro de `{!loading && products.length > 0
 * && (…)}`, así que cuando la página pedida se salía del listado no se pintaba
 * NINGÚN control.
 *
 * Medido: `/productos?pagina=999` mostraba "1089 productos" junto a "No hay
 * productos disponibles" y cero botones. El usuario sólo salía con el "atrás"
 * del navegador o editando la URL a mano. Y pasaba igual con
 * `?categoria=…&search=azul&pagina=5` cuando la búsqueda sólo daba 2 páginas.
 *
 * Se llega ahí por un enlace compartido o un marcador viejo, o sea justo por
 * el camino que el paginado en la URL venía a habilitar.
 *
 * No había ninguna prueba que RENDERIZARA el paginador: las que había cubrían
 * sólo la serialización de los query params, que estaba bien. Ésta cierra ese
 * hueco.
 */

// La primera prueba del fichero paga el import en frío de toda la página y sus
// dependencias, y con la máquina cargada eso se pasaba de los 5 s por defecto.
// No es lentitud de las pruebas: las siguientes tardan ~1 s cada una.
vi.setConfig({ testTimeout: 20000 });

const push = vi.fn();
let paramsActuales = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  useSearchParams: () => paramsActuales,
  usePathname: () => '/productos',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Los hijos no aportan nada a lo que se prueba aquí y arrastran peticiones,
// imágenes y contexto de carrito.
vi.mock('@/components/CategoryMenu', () => ({ CategoryMenu: () => null }));
vi.mock('@/components/CategoryChips', () => ({ default: () => null }));
vi.mock('@/components/SearchBar', () => ({ default: () => null }));
vi.mock('@/components/cart/CartSummaryBar', () => ({ default: () => null }));
vi.mock('@/components/product/ProductCardSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));
vi.mock('@/components/product/ProductCard', () => ({
  default: ({ product }: { product: Product }) => (
    <div data-testid="producto">{product.name}</div>
  ),
}));

const getPublicPaginated = vi.fn();
vi.mock('@/services/products', () => ({
  productsService: {
    getPublicPaginated: (...args: unknown[]) => getPublicPaginated(...args),
  },
}));

const producto = (n: number) =>
  ({ uuid: `uuid-${n}`, name: `PINT PLAST AZUL ${n}`, images: [] }) as unknown as Product;

/** Respuesta del backend: 1089 productos, 12 por página -> 91 páginas. */
const respuesta = (page: number, cuantos: number) => ({
  data: Array.from({ length: cuantos }, (_, i) => producto(i)),
  total: 1089,
  page,
  lastPage: 91,
});

const renderizar = async (query: string) => {
  paramsActuales = new URLSearchParams(query);
  render(<ProductsPage />);
  await waitFor(() => expect(getPublicPaginated).toHaveBeenCalled());
};

const paginador = () =>
  screen.queryByRole('navigation', { name: 'Paginación de productos' });

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom no implementa scrollTo y la página sube al cambiar de página.
  window.scrollTo = vi.fn();
});

describe('paginador del listado de productos', () => {
  it('se pinta con los controles cuando hay más de una página', async () => {
    getPublicPaginated.mockResolvedValue(respuesta(1, 12));
    await renderizar('');

    await waitFor(() => expect(paginador()).toBeInTheDocument());

    const nav = paginador()!;
    expect(within(nav).getByLabelText('Página 2')).toBeInTheDocument();
    expect(within(nav).getByLabelText('Página 91')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 91')).toBeInTheDocument();
  });

  it('marca la página actual con aria-current', async () => {
    getPublicPaginated.mockResolvedValue(respuesta(3, 12));
    await renderizar('pagina=3');

    await waitFor(() => expect(paginador()).toBeInTheDocument());
    expect(within(paginador()!).getByLabelText('Página 3')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('los enlaces del paginador conservan búsqueda, categoría y orden', async () => {
    getPublicPaginated.mockResolvedValue(respuesta(1, 12));
    await renderizar('search=pint+azul&categoria=uuid-cat&orden=price-asc');

    await waitFor(() => expect(paginador()).toBeInTheDocument());

    const href = within(paginador()!)
      .getByLabelText('Página 2')
      .getAttribute('href')!;

    expect(href).toContain('search=pint+azul');
    expect(href).toContain('categoria=uuid-cat');
    expect(href).toContain('orden=price-asc');
    expect(href).toContain('pagina=2');
  });

  describe('cuando la página pedida se sale del listado', () => {
    // El backend devuelve la página vacía pero el total real: 1089 productos,
    // 91 páginas, y la 999 no existe.
    const fueraDeRango = {
      data: [],
      total: 1089,
      page: 999,
      lastPage: 91,
    };

    it('NO deja al usuario sin controles', async () => {
      getPublicPaginated.mockResolvedValue(fueraDeRango);
      await renderizar('pagina=999');

      // Ésta es la regresión: antes esto no existía y no había forma de salir.
      await waitFor(() => expect(paginador()).toBeInTheDocument());
    });

    it('ofrece una salida explícita al principio del listado', async () => {
      getPublicPaginated.mockResolvedValue(fueraDeRango);
      await renderizar('pagina=999');

      const salida = await screen.findByRole('link', {
        name: 'Volver al principio',
      });
      expect(salida).toHaveAttribute('href', '/productos');
    });

    it('explica lo que pasa en vez de decir que no hay productos', async () => {
      getPublicPaginated.mockResolvedValue(fueraDeRango);
      await renderizar('pagina=999');

      expect(await screen.findByText('Esta página ya no existe')).toBeInTheDocument();
      // El mensaje de catálogo vacío sería mentira: hay 1089 productos.
      expect(
        screen.queryByText('No hay productos disponibles'),
      ).not.toBeInTheDocument();
    });

    it('el paginador apunta a páginas que SÍ existen', async () => {
      getPublicPaginated.mockResolvedValue(fueraDeRango);
      await renderizar('pagina=999');

      await waitFor(() => expect(paginador()).toBeInTheDocument());
      const nav = paginador()!;

      // "Anterior" tiene que llevar a la 90, no a la 998.
      expect(within(nav).getByLabelText('Página anterior')).toHaveAttribute(
        'href',
        '/productos?pagina=90',
      );
      expect(within(nav).getByLabelText('Página 91')).toBeInTheDocument();
    });

    it('pasa igual con una búsqueda filtrada de pocas páginas', async () => {
      // `?categoria=…&search=azul&pagina=5` cuando la búsqueda da 2 páginas.
      getPublicPaginated.mockResolvedValue({
        data: [],
        total: 23,
        page: 5,
        lastPage: 2,
      });
      await renderizar('categoria=uuid-cat&search=azul&orden=price-asc&pagina=5');

      await waitFor(() => expect(paginador()).toBeInTheDocument());

      const volver = screen.getByRole('link', { name: 'Volver al principio' });
      // La salida conserva los filtros: no tira al usuario al catálogo entero.
      expect(volver.getAttribute('href')).toContain('search=azul');
      expect(volver.getAttribute('href')).toContain('categoria=uuid-cat');
      expect(volver.getAttribute('href')).not.toContain('pagina=');
    });
  });

  it('con una sola página no pinta el paginador', async () => {
    getPublicPaginated.mockResolvedValue({
      data: [producto(1)],
      total: 1,
      page: 1,
      lastPage: 1,
    });
    await renderizar('search=algo+muy+concreto');

    await waitFor(() => expect(screen.getByTestId('producto')).toBeInTheDocument());
    expect(paginador()).not.toBeInTheDocument();
  });

  it('con el catálogo de verdad vacío sigue diciendo que no hay productos', async () => {
    getPublicPaginated.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      lastPage: 0,
    });
    await renderizar('search=nohaynada');

    expect(
      await screen.findByText('No hay productos disponibles'),
    ).toBeInTheDocument();
    expect(paginador()).not.toBeInTheDocument();
  });
});
