import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

/**
 * El marco de acceso tiene que hablar de la pantalla en la que estás.
 *
 * Antes las dos pantallas compartían un único `tagline` —el del storefront— y
 * en escritorio no había titular ninguno: el banner móvil se estiraba a lo
 * ancho y dejaba media pantalla en blanco. El diseño (lienzos 10/14 en móvil,
 * D5/D6 en escritorio) pide texto distinto en ingresar y en crear cuenta.
 *
 * El mock global de next-intl devuelve la clave tal cual, así que lo que se
 * comprueba acá es QUÉ clave pide cada pestaña, no su redacción.
 */

vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rate: 481.22, loading: false }),
  formatRate: (r: number) => String(r),
}));

import AuthShell from '../AuthShell';

const textoDe = (c: HTMLElement) => c.textContent ?? '';

describe('AuthShell — el marco distingue ingresar de crear cuenta', () => {
  it('en ingresar pide los textos de ingresar y no los de registro', () => {
    const { container } = render(<AuthShell active="login">{null}</AuthShell>);
    const texto = textoDe(container);

    expect(texto).toContain('loginTagline');
    expect(texto).toContain('loginHeadline');
    expect(texto).toContain('loginHeading');
    expect(texto).not.toContain('registerTagline');
    expect(texto).not.toContain('registerHeadline');
  });

  it('en crear cuenta pide los textos de registro y no los de ingresar', () => {
    const { container } = render(<AuthShell active="register">{null}</AuthShell>);
    const texto = textoDe(container);

    expect(texto).toContain('registerTagline');
    expect(texto).toContain('registerHeadline');
    expect(texto).toContain('registerHeading');
    expect(texto).not.toContain('loginTagline');
    expect(texto).not.toContain('loginHeadline');
  });

  it('sólo ingresar muestra las ventajas y la tasa; sólo registro, los pasos', () => {
    const login = textoDe(render(<AuthShell active="login">{null}</AuthShell>).container);
    expect(login).toContain('aside.pickupTitle');
    expect(login).toContain('aside.deliveryTitle');
    expect(login).toContain('481.22');
    expect(login).not.toContain('aside.step1');

    const registro = textoDe(render(<AuthShell active="register">{null}</AuthShell>).container);
    expect(registro).toContain('aside.step1');
    expect(registro).toContain('aside.step3');
    expect(registro).not.toContain('aside.pickupTitle');
  });

  it('marca como activa la pestaña en la que estás', () => {
    const { container } = render(<AuthShell active="register">{null}</AuthShell>);
    const enlaces = [...container.querySelectorAll('a')];
    const registro = enlaces.find((a) => a.getAttribute('href') === '/register');
    const ingresar = enlaces.find((a) => a.getAttribute('href') === '/login');

    // La activa se distingue por el fondo blanco; la otra, no.
    expect(registro?.className).toContain('bg-white');
    expect(ingresar?.className).not.toContain('bg-white');
  });

  it('el par de pestañas respeta el objetivo táctil de 44 px', () => {
    const { container } = render(<AuthShell active="login">{null}</AuthShell>);
    for (const a of container.querySelectorAll('a')) {
      expect(a.className).toContain('min-h-11');
    }
  });

  it('esconde la tasa mientras no haya dato en vez de pintar un hueco', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/useExchangeRate', () => ({
      useExchangeRate: () => ({ rate: null, loading: false }),
      formatRate: (r: number) => String(r),
    }));
    const { default: Shell } = await import('../AuthShell');
    const { container } = render(<Shell active="login">{null}</Shell>);

    expect(textoDe(container)).not.toContain('BCV');
    vi.doUnmock('@/hooks/useExchangeRate');
  });
});
