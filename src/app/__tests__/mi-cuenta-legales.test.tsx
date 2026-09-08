import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

/**
 * Regresión: contacto y las páginas legales sólo se alcanzaban desde el pie, y
 * el pie no se muestra en las pantallas a pantalla completa. Desde el listado de
 * productos o el checkout, llegar a los términos obligaba a volver al inicio y
 * bajar el pie entero. "Cuenta" está en la barra inferior en todas las pantallas
 * con cromo, así que este bloque es el camino corto — y tiene que estar tanto si
 * el cliente ha iniciado sesión como si no.
 */

const mockUser = vi.fn<() => { firstName: string; lastName: string; email: string } | null>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/mi-cuenta',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser(), logout: vi.fn() }),
}));
vi.mock('@/hooks/useStoreInfo', () => ({
  useStoreInfo: () => ({
    storeInfo: { address: 'Av. Principal', city: 'Ciudad Bolívar', phone: '02856320178' },
    loading: false,
    error: false,
  }),
}));

import MiCuentaPage from '../mi-cuenta/page';

const RUTAS_LEGALES = ['/contact', '/terms', '/privacy'];

beforeEach(() => {
  mockUser.mockReturnValue(null);
});

const enlacesDe = (container: HTMLElement) =>
  [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');

describe('Mi cuenta — atajo a contacto y páginas legales', () => {
  it('ofrece los tres enlaces a quien no ha iniciado sesión', () => {
    const { container } = render(<MiCuentaPage />);
    for (const ruta of RUTAS_LEGALES) {
      expect(enlacesDe(container)).toContain(ruta);
    }
  });

  it('ofrece los tres enlaces a quien sí ha iniciado sesión', () => {
    mockUser.mockReturnValue({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@ejemplo.com' });
    const { container } = render(<MiCuentaPage />);
    for (const ruta of RUTAS_LEGALES) {
      expect(enlacesDe(container)).toContain(ruta);
    }
  });

  it('deja los enlaces con altura suficiente para el dedo', () => {
    // Es una pantalla de móvil: por debajo de 44px se falla el toque.
    const { container } = render(<MiCuentaPage />);
    for (const ruta of RUTAS_LEGALES) {
      const enlace = container.querySelector(`a[href="${ruta}"]`);
      expect(enlace?.className).toContain('min-h-11');
    }
  });

  it('no enlaza a las portadas genéricas de las redes', () => {
    // Mismo criterio que en el pie: sin perfil configurado, sin icono.
    delete process.env.NEXT_PUBLIC_FACEBOOK_URL;
    delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;
    delete process.env.NEXT_PUBLIC_TWITTER_URL;

    const { container } = render(<MiCuentaPage />);
    const hrefs = enlacesDe(container);
    for (const portada of ['https://facebook.com', 'https://instagram.com', 'https://twitter.com']) {
      expect(hrefs).not.toContain(portada);
    }
  });
});
