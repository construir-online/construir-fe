import { describe, it, expect, afterEach } from 'vitest';
import { perfilesSociales } from '../social';

/**
 * Regresión: los tres iconos sociales del pie y de "Mi cuenta" llevaban a las
 * portadas genéricas (`https://facebook.com` y compañía), no a los perfiles de
 * la tienda. Mientras el pie sólo se veía en escritorio pasaba desapercibido;
 * al mostrarlo en el teléfono —y agrandar los iconos a 44px para el dedo— se
 * volvió un enlace fácil de pulsar que saca al cliente de la tienda.
 *
 * Es el mismo criterio que se aplicó a los teléfonos muertos: si no hay destino,
 * no se pinta el enlace.
 */

const entorno = { ...process.env };

afterEach(() => {
  process.env = { ...entorno };
});

const sinRedes = () => {
  delete process.env.NEXT_PUBLIC_FACEBOOK_URL;
  delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  delete process.env.NEXT_PUBLIC_TWITTER_URL;
};

describe('perfilesSociales', () => {
  it('no devuelve nada si no hay ninguna variable configurada', () => {
    sinRedes();
    expect(perfilesSociales()).toEqual([]);
  });

  it('devuelve sólo las redes configuradas', () => {
    sinRedes();
    process.env.NEXT_PUBLIC_INSTAGRAM_URL = 'https://instagram.com/hierrosricupero';
    expect(perfilesSociales()).toEqual([
      { red: 'instagram', url: 'https://instagram.com/hierrosricupero' },
    ]);
  });

  it('mantiene el orden Facebook, Instagram, Twitter', () => {
    sinRedes();
    process.env.NEXT_PUBLIC_TWITTER_URL = 'https://x.com/ricupero';
    process.env.NEXT_PUBLIC_FACEBOOK_URL = 'https://facebook.com/ricupero';
    expect(perfilesSociales().map((p) => p.red)).toEqual(['facebook', 'twitter']);
  });

  it('ignora una variable a medio configurar', () => {
    // "facebook.com/tienda" sin esquema sería un enlace relativo dentro de la
    // tienda, que es peor que no pintar el icono.
    sinRedes();
    process.env.NEXT_PUBLIC_FACEBOOK_URL = 'facebook.com/ricupero';
    process.env.NEXT_PUBLIC_INSTAGRAM_URL = '   ';
    process.env.NEXT_PUBLIC_TWITTER_URL = 'pendiente';
    expect(perfilesSociales()).toEqual([]);
  });

  it('no acepta esquemas que no sean http o https', () => {
    sinRedes();
    process.env.NEXT_PUBLIC_FACEBOOK_URL = 'javascript:alert(1)';
    expect(perfilesSociales()).toEqual([]);
  });
});
