import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  ALTO_BARRA_CARRITO_PX,
  ALTO_BARRA_INFERIOR_PX,
  CLASE_HUECO_PIE_NAV_Y_CARRITO,
  CLASE_HUECO_PIE_SOLO_NAV,
  esRutaDeCatalogo,
} from '@/components/cart/barras-fijas';

/**
 * La barra flotante de carrito y lo que ya vivía pegado al borde inferior.
 *
 * El pie ya se perdió una vez detrás de una barra fija: llevaba `hidden
 * md:block`, se hizo visible en móvil y la navegación inferior le tapó el
 * copyright y los enlaces legales. Ahora se añade una SEGUNDA barra fija a las
 * mismas pantallas, así que lo que hay que fijar es:
 *
 *  - que la barra de carrito no se ponga encima de la navegación inferior, que
 *    es el único camino para moverse por la tienda desde el teléfono;
 *  - que el pie siga teniendo hueco cuando están las dos;
 *  - y que no aparezca donde no toca (la ficha ya tiene su propia barra fija,
 *    y el carrito y el checkout se diseñaron sin cromo).
 */

const mockPathname = vi.fn<() => string>();
const totalItems = vi.fn<() => number>();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('@/components/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav" />,
}));
vi.mock('@/components/cart/CartDrawer', () => ({ default: () => null }));
vi.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    isCartOpen: false,
    closeCart: vi.fn(),
    getTotalItems: () => totalItems(),
  }),
}));
// La barra se renderiza de verdad: lo que se mide es su clase de posición, que
// es justo donde estaría el bug de solape.
vi.mock('@/hooks/useCartTotals', () => ({
  useCartTotals: () => ({
    totalItems: totalItems(),
    subtotal: 44.1,
    subtotalVES: 5220,
  }),
}));
vi.mock('@/lib/analytics', () => ({ initGA: vi.fn(), trackPageView: vi.fn() }));
vi.mock('@/services/analytics', () => ({ analyticsService: { trackPageView: vi.fn() } }));
vi.mock('@/hooks/useStoreInfo', () => ({
  useStoreInfo: () => ({
    storeInfo: {
      address: 'Av. Principal',
      city: 'Puerto Ordaz',
      phone: '02856320178',
      email: 'info@constru-ir.com',
      hours: 'Lun a Vie 8:00-17:00',
    },
    loading: false,
    error: false,
  }),
}));

import ClientLayout from '../ClientLayout';

const montar = (ruta: string, articulos = 3) => {
  mockPathname.mockReturnValue(ruta);
  totalItems.mockReturnValue(articulos);
  return render(
    <ClientLayout>
      <div>contenido</div>
    </ClientLayout>,
  );
};

const barra = (c: HTMLElement) => c.querySelector('[data-testid="barra-carrito"]');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dónde acompaña la barra de carrito', () => {
  it.each(['/', '/categorias', '/categorias/cemento'])(
    'aparece en %s, que es catálogo con cromo',
    (ruta) => {
      const { container } = montar(ruta);
      expect(barra(container)).not.toBeNull();
    },
  );

  it('no aparece con el carrito vacío', () => {
    const { container } = montar('/categorias', 0);
    expect(barra(container)).toBeNull();
  });

  it.each(['/contact', '/about', '/mi-cuenta', '/terms', '/seguimiento'])(
    'no aparece en %s, que no es catálogo',
    (ruta) => {
      const { container } = montar(ruta);
      expect(barra(container)).toBeNull();
    },
  );

  /**
   * La ficha ya tiene su propia barra fija con el selector de cantidad y el
   * botón de agregar. Apilar la de carrito encima le comería un cuarto de la
   * pantalla a la información del producto.
   */
  it('no la añade el layout en la ficha de producto', () => {
    const { container } = montar('/productos/uuid-cemento');
    expect(barra(container)).toBeNull();
  });

  it('no la añade el layout en el listado (la pinta la propia pantalla)', () => {
    const { container } = montar('/productos');
    expect(barra(container)).toBeNull();
  });

  it.each(['/carrito', '/checkout', '/checkout/pago'])(
    'no aparece en %s: ahí el total ya está en pantalla',
    (ruta) => {
      const { container } = montar(ruta);
      expect(barra(container)).toBeNull();
    },
  );

  it.each(['/admin', '/admin/productos', '/login'])(
    'no aparece en %s, que no lleva cromo de tienda',
    (ruta) => {
      const { container } = montar(ruta);
      expect(barra(container)).toBeNull();
    },
  );
});

describe('la barra de carrito no tapa la navegación inferior', () => {
  it('se apoya encima de ella, no sobre ella', () => {
    const { container, getByTestId } = montar('/categorias');

    // Las dos existen en la misma pantalla: es el caso de solape.
    expect(getByTestId('bottom-nav')).toBeTruthy();

    const clases = barra(container)!.className;
    expect(clases).toContain('bottom-[calc(50px+env(safe-area-inset-bottom))]');
    // `bottom-0` la pondría justo encima de las cinco pestañas, que son el
    // único camino para moverse por la tienda desde el teléfono.
    expect(clases.split(/\s+/)).not.toContain('bottom-0');
  });
});

describe('el pie sigue teniendo hueco', () => {
  it('con la barra de carrito, el hueco crece', () => {
    const { container } = montar('/categorias');
    const envoltorio = container.querySelector('footer')!.parentElement!;

    expect(envoltorio.className).toContain(CLASE_HUECO_PIE_NAV_Y_CARRITO);
  });

  it('sin ella, el hueco es el de siempre', () => {
    const { container } = montar('/categorias', 0);
    const envoltorio = container.querySelector('footer')!.parentElement!;

    expect(envoltorio.className).toContain(CLASE_HUECO_PIE_SOLO_NAV);
    // Y no el grande: reservar de más abre una franja vacía al final.
    expect(envoltorio.className).not.toContain('8.5rem');
  });

  /**
   * La cuenta, no la clase. Ésta es la prueba que caza el caso de "alguien
   * cambió el alto de una barra y se olvidó del pie": el hueco tiene que
   * cubrir las dos barras juntas.
   */
  it('el hueco reservado cubre las dos barras juntas', () => {
    const rem = (clase: string) => {
      const encontrado = /pb-\[calc\(([\d.]+)rem\+/.exec(clase);
      return Number(encontrado![1]);
    };

    const soloNav = rem(CLASE_HUECO_PIE_SOLO_NAV) * 16;
    const navYCarrito = rem(CLASE_HUECO_PIE_NAV_Y_CARRITO) * 16;

    expect(soloNav).toBeGreaterThanOrEqual(ALTO_BARRA_INFERIOR_PX);
    expect(navYCarrito).toBeGreaterThanOrEqual(
      ALTO_BARRA_INFERIOR_PX + ALTO_BARRA_CARRITO_PX,
    );
  });

  /**
   * Y el desplazamiento de la barra tiene que coincidir con el alto real de la
   * navegación inferior: si se separan, queda una franja del fondo entre las
   * dos o la de carrito se le monta encima.
   */
  it('la barra se separa del borde exactamente el alto de la navegación inferior', () => {
    const { container } = montar('/categorias');
    const encontrado = /bottom-\[calc\((\d+)px\+/.exec(barra(container)!.className);

    expect(Number(encontrado![1])).toBe(ALTO_BARRA_INFERIOR_PX);
  });
});

describe('esRutaDeCatalogo', () => {
  it.each(['/', '/productos', '/categorias', '/categorias/obra-gris'])(
    'reconoce %s',
    (ruta) => expect(esRutaDeCatalogo(ruta)).toBe(true),
  );

  it.each([
    '/productos/uuid-cemento',
    '/carrito',
    '/checkout',
    '/mi-cuenta',
    '/contact',
    '',
  ])('descarta %s', (ruta) => expect(esRutaDeCatalogo(ruta)).toBe(false));

  it('aguanta un pathname ausente', () => {
    expect(esRutaDeCatalogo(null)).toBe(false);
    expect(esRutaDeCatalogo(undefined)).toBe(false);
  });
});
