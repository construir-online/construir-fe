import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

/**
 * Regresión: el pie iba envuelto en `hidden md:block`, así que en el teléfono
 * no se veía en NINGUNA ruta. Como los enlaces a /contact, /about, /terms y
 * /privacy sólo viven en el pie —la barra inferior no los lleva—, esas páginas
 * quedaban inalcanzables para la mayoría de los clientes de la tienda, que
 * compran desde el móvil.
 *
 * Estas pruebas fijan DÓNDE se ve el pie, no qué enlaces tiene:
 *  - visible en las rutas normales (inicio, categorías, contacto, about,
 *    mi-cuenta, terms, privacy),
 *  - sigue oculto en móvil en las pantallas completas (productos, carrito,
 *    checkout), que se diseñaron sin cromo a propósito,
 *  - y no queda tapado por la barra inferior fija.
 */

const mockPathname = vi.fn<() => string>();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// La cabecera, la barra inferior y el carrito no son el objeto de esta prueba:
// arrastran contextos y peticiones que no aportan nada a "¿se ve el pie?".
vi.mock('@/components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('@/components/BottomNav', () => ({ default: () => <div data-testid="bottom-nav" /> }));
vi.mock('@/components/cart/CartDrawer', () => ({ default: () => null }));
vi.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ isCartOpen: false, closeCart: vi.fn(), getTotalItems: () => 0 }),
}));
vi.mock('@/lib/analytics', () => ({ initGA: vi.fn(), trackPageView: vi.fn() }));
vi.mock('@/services/analytics', () => ({ analyticsService: { trackPageView: vi.fn() } }));
// El pie sí se renderiza de verdad; sólo se le corta la llamada al backend.
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

/** El pie tal como lo ve el teléfono: existir en el DOM no basta, el bug era
 *  precisamente un pie presente pero con el envoltorio en `display: none`. */
const pieVisibleEnMovil = () => {
  const pie = document.querySelector('footer');
  if (!pie) return false;
  for (let el = pie.parentElement; el; el = el.parentElement) {
    if (el.classList.contains('hidden')) return false;
  }
  return true;
};

const montar = (ruta: string) => {
  mockPathname.mockReturnValue(ruta);
  return render(<ClientLayout><div>contenido</div></ClientLayout>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ClientLayout — visibilidad del pie en móvil', () => {
  const rutasNormales = [
    '/',
    '/categorias',
    '/categorias/cemento',
    '/contact',
    '/about',
    '/mi-cuenta',
    '/mi-cuenta/pedidos',
    '/terms',
    '/privacy',
    '/seguimiento',
  ];

  it.each(rutasNormales)('muestra el pie en móvil en %s', (ruta) => {
    montar(ruta);
    expect(pieVisibleEnMovil()).toBe(true);
  });

  const rutasPantallaCompleta = ['/productos', '/productos/martillo', '/carrito', '/checkout'];

  it.each(rutasPantallaCompleta)('deja el pie sólo para escritorio en %s', (ruta) => {
    const { container } = montar(ruta);
    // Sigue en el DOM para el escritorio, pero oculto en móvil
    expect(container.querySelector('footer')).not.toBeNull();
    expect(pieVisibleEnMovil()).toBe(false);
  });

  it('no monta el pie en el panel de administración ni en las pantallas de acceso', () => {
    for (const ruta of ['/admin', '/admin/productos', '/login', '/register', '/reset-password']) {
      const { container, unmount } = montar(ruta);
      expect(container.querySelector('footer')).toBeNull();
      unmount();
    }
  });
});

describe('ClientLayout — el pie no queda bajo la barra inferior', () => {
  it('deja un colchón al final del pie del alto de la barra fija', () => {
    const { container } = montar('/');
    const envoltorio = container.querySelector('footer')!.parentElement!;
    // 4rem = 64px, por encima de los ~50px de la barra, más la safe-area del
    // iPhone. Sin esto la barra tapaba el copyright y los enlaces legales.
    expect(envoltorio.className).toContain('pb-[calc(4rem+env(safe-area-inset-bottom))]');
    expect(envoltorio.className).toContain('md:pb-0');
  });

  it('quita el colchón de `main` cuando el pie va debajo', () => {
    // Los dos paddings juntos abrían una franja blanca entre el contenido y el
    // pie; con el pie visible, el colchón lo pone el pie.
    const { container } = montar('/');
    expect(container.querySelector('main')!.className).not.toContain('pb-16');
  });

  it('en las pantallas completas no hay ni pie ni barra que tapar', () => {
    // Ahí el diseño quita el cromo entero, así que nada queda debajo de nada.
    const { queryByTestId } = montar('/checkout');
    expect(queryByTestId('bottom-nav')).toBeNull();
    expect(pieVisibleEnMovil()).toBe(false);
  });
});
