import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

/**
 * **Aquí vive la regresión de verdad, y por eso esta prueba existe.**
 *
 * El backend quitó `userAgent` de su DTO y valida con `forbidNonWhitelisted`,
 * así que mandarlo devuelve un 400. Y `analyticsService.trackPageView` traga sus
 * errores a propósito —la analítica no debe romper la navegación—, con lo que
 * el fallo no se ve por ninguna parte: simplemente dejan de contarse páginas.
 *
 * Antes había aquí una prueba sobre el servicio que llamaba a `trackPageView`
 * sin pasar `userAgent` y comprobaba que el cuerpo no lo llevaba. No podía
 * fallar: nunca metía el campo. Y sobre todo miraba al sitio equivocado — quien
 * arma el cuerpo es este componente, no el servicio. Poniendo de vuelta
 * `userAgent: navigator.userAgent` en `ClientLayout` la suite entera seguía en
 * verde mientras cada visita se perdía.
 *
 * Lo que se comprueba es el cuerpo exacto que `ClientLayout` construye.
 */

const trackPageView = vi.fn();

vi.mock('@/services/analytics', () => ({
  analyticsService: { trackPageView: (...args: unknown[]) => trackPageView(...args) },
}));
vi.mock('@/lib/analytics', () => ({ initGA: vi.fn(), trackPageView: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/productos' }));

// El resto del layout no pinta en esta prueba: se sustituye por marcadores para
// no arrastrar el árbol entero de la tienda hasta aquí.
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/BottomNav', () => ({ default: () => null }));
vi.mock('@/components/cart/CartDrawer', () => ({ default: () => null }));
vi.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ isCartOpen: false, closeCart: vi.fn() }),
}));

const ClientLayout = (await import('../ClientLayout')).default;

describe('ClientLayout — el cuerpo de la visita que se manda al backend', () => {
  beforeEach(() => trackPageView.mockClear());

  const cuerpoEnviado = () => {
    render(<ClientLayout>contenido</ClientLayout>);
    expect(trackPageView).toHaveBeenCalled();
    return trackPageView.mock.calls[0][0] as Record<string, unknown>;
  };

  it('manda exactamente path, title y referrer', () => {
    expect(Object.keys(cuerpoEnviado()).sort()).toEqual([
      'path',
      'referrer',
      'title',
    ]);
  });

  it('NO manda el navegador: el backend lo rechaza con un 400', () => {
    const cuerpo = cuerpoEnviado();

    expect(cuerpo).not.toHaveProperty('userAgent');
    // Y no se cuela con otro nombre: `navigator.userAgent` no aparece en el
    // cuerpo por ninguna vía.
    expect(JSON.stringify(cuerpo)).not.toContain(navigator.userAgent);
  });

  it('tampoco manda nada que identifique al visitante', () => {
    const cuerpo = cuerpoEnviado();

    ['ip', 'ipAddress', 'userAgent', 'screen', 'language'].forEach((campo) =>
      expect(cuerpo).not.toHaveProperty(campo),
    );
  });

  it('sí manda la ruta, que es lo único que se consulta de esta tabla', () => {
    expect(cuerpoEnviado().path).toBe('/productos');
  });
});
