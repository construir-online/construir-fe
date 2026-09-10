import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

/**
 * Regresión de maquetación: el desplegable del tipo de identificación se comía
 * la fila entera y dejaba el número de cédula reducido a un cuadrito vacío al
 * borde de la pantalla — a 390 px se salía del viewport.
 *
 * La causa: el `select` llevaba `w-24` ANTES de la clase común de los campos,
 * que trae `w-full`. Tailwind no desempata por especificidad sino por el orden
 * en la hoja, así que ganaba `w-full`. En jsdom no hay layout que medir, de
 * modo que lo que se fija acá es justo eso: que el ancho del `select` gane el
 * desempate contra `w-full`.
 */

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ register: vi.fn() }),
}));

import RegisterPage from '../page';

const selectDe = (c: HTMLElement) => c.querySelector('select') as HTMLSelectElement;

describe('Crear cuenta — la fila de identificación', () => {
  it('da al tipo un ancho fijo que le gana al w-full de los campos', () => {
    const { container } = render(<RegisterPage />);
    const select = selectDe(container);

    expect(select).toBeTruthy();
    // Si el ancho no lleva `!`, `w-full` vuelve a ganar y el número desaparece.
    expect(select.className).toMatch(/!w-\d+/);
  });

  it('deja al número de identificación quedarse con el resto de la fila', () => {
    const { container } = render(<RegisterPage />);
    const numero = container.querySelector('#identificationNumber') as HTMLInputElement;

    expect(numero).toBeTruthy();
    expect(numero.className).toContain('flex-1');
    // `min-w-0` es lo que permite que el campo encoja dentro del flex en vez de
    // empujar la fila y desbordar la pantalla a 390 px.
    expect(numero.className).toContain('min-w-0');
  });

  it('mantiene el tipo y el número en la misma fila', () => {
    const { container } = render(<RegisterPage />);
    const select = selectDe(container);
    const numero = container.querySelector('#identificationNumber');

    expect(select.parentElement).toBe(numero?.parentElement);
    expect(select.parentElement?.className).toContain('flex');
  });

  it('recuerda el mínimo de la contraseña aunque no haya error', () => {
    const { container } = render(<RegisterPage />);
    // La ayuda vivía sólo en el placeholder, así que se iba justo al empezar a
    // escribir — que es cuando hace falta.
    expect(container.textContent).toContain('passwordHelp');
  });
});
