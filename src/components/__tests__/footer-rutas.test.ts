import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Cada `<Link href="/...">` del pie de página tiene que apuntar a una ruta que
 * exista de verdad.
 *
 * Ésta es la regresión que originó el trabajo: el pie enlazaba a /contact,
 * /terms y /privacy desde siempre y ninguna de las tres páginas existía, así
 * que al cliente le salía el 404 de Next desde un enlace que la propia tienda
 * le ponía delante. Nadie se dio cuenta porque un enlace roto no rompe ni el
 * build ni los tipos. Este test lee el Footer real —no una lista copiada a
 * mano, que se desincronizaría— y comprueba el `page.tsx` de cada destino.
 */
const raizProyecto = path.resolve(__dirname, '../../..');
const footer = path.join(raizProyecto, 'src/components/Footer.tsx');

/** Rutas internas del pie; las externas (http…) y los mailto no se comprueban. */
function rutasInternasDelFooter(): string[] {
  const fuente = require('fs').readFileSync(footer, 'utf8') as string;
  const encontradas = [...fuente.matchAll(/href="(\/[^"{}]*)"/g)].map((m) => m[1]);
  return [...new Set(encontradas)];
}

/** ¿Existe un `page.tsx` para esta ruta del App Router? */
function existeLaPagina(ruta: string): boolean {
  const segmentos = ruta.replace(/^\/+|\/+$/g, '');
  const carpeta = path.join(raizProyecto, 'src/app', segmentos);
  return ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].some((archivo) =>
    existsSync(path.join(carpeta, archivo)),
  );
}

describe('enlaces del pie de página', () => {
  it('encuentra enlaces internos que revisar', () => {
    // Si el regex deja de casar (por comillas simples o href dinámico), el
    // resto del test pasaría en vacío y no protegería nada.
    expect(rutasInternasDelFooter().length).toBeGreaterThanOrEqual(6);
  });

  it('todas las rutas enlazadas existen', () => {
    for (const ruta of rutasInternasDelFooter()) {
      expect(existeLaPagina(ruta), `el pie enlaza a ${ruta} y no hay page.tsx`).toBe(true);
    }
  });

  it('las páginas legales siguen enlazadas desde el pie', () => {
    // Que existan no basta: si alguien quita el enlace, el cliente no tiene
    // desde dónde llegar a ellas.
    const rutas = rutasInternasDelFooter();
    expect(rutas).toContain('/terms');
    expect(rutas).toContain('/privacy');
    expect(rutas).toContain('/contact');
  });
});
