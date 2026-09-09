import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * El registro de visitas se dispara en cada navegación de la tienda y falla en
 * silencio, así que un error aquí no se ve: simplemente dejan de contarse
 * páginas. Dos regresiones que estas pruebas fijan:
 *
 * 1. El backend ya no acepta campos más largos que sus columnas (antes no
 *    validaba y el varchar(500) reventaba contra la base). `document.referrer`
 *    es una URL ajena que pasa de 500 caracteres sin esfuerzo, así que si no se
 *    recorta aquí la visita se pierde entera con un 400.
 * 2. El cuerpo no lleva —ni debe llevar— nada que identifique al visitante.
 *
 * Aquí había además una prueba de que no se manda el `userAgent` que llamaba a
 * `trackPageView` sin pasarlo: no podía fallar, porque nunca metía el campo. Y
 * miraba al sitio equivocado — quien arma el cuerpo es `ClientLayout`, no este
 * servicio. Esa comprobación se hace ahora donde está el riesgo, en
 * `src/app/__tests__/ClientLayout.analitica.test.tsx`.
 */

const post = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/api', () => ({ apiClient: { post, get: vi.fn() } }));

const { analyticsService } = await import('../analytics');

describe('analyticsService.trackPageView', () => {
  beforeEach(() => post.mockClear());

  it('envía la visita tal cual cuando cabe en los límites', async () => {
    await analyticsService.trackPageView({
      path: '/productos',
      title: 'Productos',
      referrer: 'https://google.com',
    });

    expect(post).toHaveBeenCalledWith('/analytics/page-view', {
      path: '/productos',
      title: 'Productos',
      referrer: 'https://google.com',
    });
  });

  it('recorta un referrer largo en vez de perder la visita', async () => {
    await analyticsService.trackPageView({
      path: '/',
      referrer: `https://ejemplo.com/?q=${'a'.repeat(900)}`,
    });

    const cuerpo = post.mock.calls[0][1];
    expect(cuerpo.referrer).toHaveLength(500);
    expect(cuerpo.path).toBe('/');
  });

  it('recorta también path y title a lo que acepta el backend', async () => {
    await analyticsService.trackPageView({
      path: `/${'a'.repeat(900)}`,
      title: 'b'.repeat(900),
    });

    const cuerpo = post.mock.calls[0][1];
    expect(cuerpo.path).toHaveLength(500);
    expect(cuerpo.title).toHaveLength(500);
  });

  it('no manda ningún campo de IP: ese dato ya no se recoge', async () => {
    await analyticsService.trackPageView({ path: '/carrito' });

    const cuerpo = post.mock.calls[0][1];
    expect(Object.keys(cuerpo)).toEqual(['path']);
    expect(cuerpo).not.toHaveProperty('ip');
    expect(cuerpo).not.toHaveProperty('ipAddress');
    expect(cuerpo).not.toHaveProperty('userAgent');
  });

  it('no rompe la navegación si el backend falla', async () => {
    post.mockRejectedValueOnce(new Error('500'));
    await expect(
      analyticsService.trackPageView({ path: '/' })
    ).resolves.toBeUndefined();
  });
});
