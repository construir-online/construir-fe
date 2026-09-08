import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * El pie pasó a verse en el teléfono, y con eso quedaron a la vista dos cosas
 * que en escritorio se toleraban:
 *
 *  - el boletín era un `setTimeout` que respondía "¡Gracias por suscribirte!"
 *    sin llamar a ningún backend: una confirmación falsa para la mayoría de los
 *    clientes;
 *  - los tres iconos sociales apuntaban a las portadas genéricas de cada red
 *    (facebook.com, instagram.com, twitter.com), no a los perfiles de la tienda,
 *    y encima se agrandaron a 44px para el dedo.
 *
 * Estas pruebas evitan que cualquiera de las dos vuelva.
 */

vi.mock('@/hooks/useStoreInfo', () => ({
  useStoreInfo: () => ({
    storeInfo: {
      address: 'Av. Principal',
      city: 'Ciudad Bolívar',
      phone: '02856320178',
      email: 'info@constru-ir.com',
      hours: 'Lun a Vie 8:00-17:00',
    },
    loading: false,
    error: false,
  }),
}));

import Footer from '../Footer';

const entornoOriginal = { ...process.env };

beforeEach(() => {
  // Por defecto, ninguna red configurada: es como está hoy la tienda.
  delete process.env.NEXT_PUBLIC_FACEBOOK_URL;
  delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  delete process.env.NEXT_PUBLIC_TWITTER_URL;
});

afterEach(() => {
  process.env = { ...entornoOriginal };
});

describe('Footer — el boletín simulado no vuelve', () => {
  it('no pinta ningún formulario de suscripción', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('input[type="email"]')).toBeNull();
  });

  it('no deja rastro de las claves de traducción del boletín', () => {
    // El mock de next-intl devuelve la clave tal cual, así que si alguna
    // sobreviviera aparecería literalmente en el texto del pie.
    const { container } = render(<Footer />);
    const texto = container.textContent ?? '';
    for (const clave of [
      'newsletter',
      'newsletterDescription',
      'emailPlaceholder',
      'subscribe',
      'subscribing',
      'subscribeSuccess',
      'subscribeError',
    ]) {
      expect(texto).not.toContain(clave);
    }
  });
});

describe('Footer — iconos sociales sólo si llevan a alguna parte', () => {
  it('no pinta ninguna red cuando no hay perfiles configurados', () => {
    const { container } = render(<Footer />);
    const externos = [...container.querySelectorAll('a[href^="http"]')].map((a) =>
      a.getAttribute('href'),
    );
    // Sólo puede quedar el enlace de WhatsApp, que sí es un destino real
    expect(externos.filter((h) => !h?.includes('wa.me'))).toEqual([]);
    expect(screen.queryByLabelText('Facebook')).toBeNull();
    expect(screen.queryByLabelText('Instagram')).toBeNull();
    expect(screen.queryByLabelText('Twitter')).toBeNull();
  });

  it('pinta el perfil configurado y nunca la portada genérica', () => {
    // El fallo original: un enlace fácil de pulsar que no lleva a la tienda.
    process.env.NEXT_PUBLIC_FACEBOOK_URL = 'https://facebook.com/hierrosricupero';

    const { container } = render(<Footer />);
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');

    expect(hrefs).toContain('https://facebook.com/hierrosricupero');
    for (const portada of ['https://facebook.com', 'https://instagram.com', 'https://twitter.com']) {
      expect(hrefs).not.toContain(portada);
    }
  });
});
