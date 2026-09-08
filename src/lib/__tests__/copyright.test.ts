import { describe, it, expect } from 'vitest';
import { lineaCopyright } from '../copyright';
import esMessages from '../../../messages/es.json';
import enMessages from '../../../messages/en.json';

/**
 * Regresión: la plantilla del pie era `© {year} {companyName}. {allRights}.` y
 * la razón social ya termina en punto, así que el cliente leía
 * "Hierros Ricupero, C.A.. Todos los derechos reservados.".
 *
 * Se comprueba contra los textos reales de los dos idiomas, no contra ejemplos
 * inventados: el fallo dependía justo de cómo está escrita la razón social.
 */
describe('lineaCopyright', () => {
  it('no duplica el punto con la razón social real, en español', () => {
    const linea = lineaCopyright(
      2026,
      esMessages.footer.companyName,
      esMessages.footer.allRightsReserved,
    );
    expect(linea).toBe('© 2026 Hierros Ricupero, C.A. Todos los derechos reservados.');
    expect(linea).not.toContain('..');
  });

  it('no duplica el punto con la razón social real, en inglés', () => {
    const linea = lineaCopyright(
      2026,
      enMessages.footer.companyName,
      enMessages.footer.allRightsReserved,
    );
    expect(linea).toBe('© 2026 Hierros Ricupero, C.A. All rights reserved.');
    expect(linea).not.toContain('..');
  });

  it('sí pone el punto cuando la razón social no lo trae', () => {
    // Si algún día cambia el nombre, la frase no puede quedarse sin separar.
    expect(lineaCopyright(2026, 'Construir', 'Todos los derechos reservados'))
      .toBe('© 2026 Construir. Todos los derechos reservados.');
  });

  it('tolera espacios sobrantes en las traducciones', () => {
    expect(lineaCopyright(2026, '  Construir  ', ' Todos los derechos reservados '))
      .toBe('© 2026 Construir. Todos los derechos reservados.');
  });
});
