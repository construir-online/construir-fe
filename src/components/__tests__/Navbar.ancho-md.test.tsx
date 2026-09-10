import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Regresión: al sacar el chip de la tasa BCV también a escritorio, la fila de
 * la cabecera dejó de caber justo en 768px con la sesión abierta —enlaces,
 * buscador, chip, carrito y menú de usuario— y el documento se iba 2px por
 * encima del viewport, con barra de desplazamiento horizontal.
 *
 * La prueba mira el marcado y no el navegador: jsdom no resuelve utilidades de
 * Tailwind, así que medir anchos acá daría siempre cero y no probaría nada.
 * Lo que se fija es el acuerdo que da la holgura: el buscador arranca estrecho
 * y sólo se ensancha a partir de `lg`.
 */
const navbar = fs.readFileSync(
  path.resolve(__dirname, '../Navbar.tsx'),
  'utf8',
);

describe('Navbar · holgura en la banda md', () => {
  it('el buscador de escritorio arranca estrecho y se ensancha en lg', () => {
    expect(navbar).toContain('w-36 lg:w-44');
  });

  it('no deja el buscador con un ancho fijo de w-44', () => {
    // `w-44` a secas era el ancho que no cabía a 768px.
    expect(navbar).not.toMatch(/className="w-44"/);
  });

  it('el chip de la tasa sigue montado en el grupo de escritorio', () => {
    const grupoEscritorio = navbar.slice(navbar.indexOf('hidden md:flex'));
    expect(grupoEscritorio).toContain('<RateChip />');
  });
});
