import { describe, it, expect } from 'vitest';
import {
  CATEGORY_GRID_CLASS,
  CATEGORY_GRID_MAX_COLS,
  FEATURED_GRID_CLASS,
  FEATURED_MAX,
  contarEsqueletos,
  limitarDestacadas,
} from '../category-grid';

/**
 * Evita la regresión que motivó este módulo: las rejillas de categorías estaban
 * copiadas a mano en tres archivos y la de `/categorias` se quedó clavada en
 * `grid-cols-3` a todos los anchos, así que en un monitor de 1536px salían tres
 * tarjetas cuadradas de casi 500px de lado.
 */
describe('CATEGORY_GRID_CLASS', () => {
  it('sube de columnas en cada punto de corte, sin quedarse en 3', () => {
    for (const clase of [
      'grid-cols-3',
      'sm:grid-cols-4',
      'md:grid-cols-5',
      'lg:grid-cols-6',
      'xl:grid-cols-7',
      '2xl:grid-cols-8',
    ]) {
      expect(CATEGORY_GRID_CLASS).toContain(clase);
    }
  });

  it('declara como máximo el número de columnas que dice CATEGORY_GRID_MAX_COLS', () => {
    // Si alguien añade un `3xl:grid-cols-10` y olvida la constante, el número de
    // esqueletos deja de cuadrar con las columnas y la última fila queda coja.
    const columnas = [...CATEGORY_GRID_CLASS.matchAll(/grid-cols-(\d+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...columnas)).toBe(CATEGORY_GRID_MAX_COLS);
  });
});

describe('FEATURED_GRID_CLASS', () => {
  it('sólo usa números de columna que dividen a FEATURED_MAX', () => {
    // El bug original: el paso intermedio `sm:grid-cols-4` con seis destacadas
    // dejaba la última fila con dos tarjetas y dos huecos entre 640 y 1023px.
    const columnas = [...FEATURED_GRID_CLASS.matchAll(/grid-cols-(\d+)/g)].map((m) => Number(m[1]));
    expect(columnas.length).toBeGreaterThan(0);
    for (const c of columnas) {
      expect(FEATURED_MAX % c).toBe(0);
    }
  });
});

describe('limitarDestacadas', () => {
  it('recorta al máximo que la rejilla coloca en filas completas', () => {
    const muchas = Array.from({ length: 20 }, (_, i) => ({ uuid: String(i) }));
    expect(limitarDestacadas(muchas)).toHaveLength(FEATURED_MAX);
  });

  it('aguanta lista vacía y lista de uno', () => {
    expect(limitarDestacadas([])).toEqual([]);
    expect(limitarDestacadas([{ uuid: 'a' }])).toHaveLength(1);
  });

  it('no revienta con un máximo absurdo', () => {
    expect(limitarDestacadas([{ uuid: 'a' }], -3)).toEqual([]);
  });
});

describe('contarEsqueletos', () => {
  it('siempre devuelve un múltiplo del número de columnas', () => {
    // Con 9 esqueletos y 8 columnas la fila de carga quedaba con un solo hueco
    // ocupado y al llegar los datos el layout pegaba un salto.
    for (const cols of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(contarEsqueletos(cols, 24) % cols).toBe(0);
      expect(contarEsqueletos(cols, 24)).toBeGreaterThanOrEqual(24);
    }
  });

  it('nunca devuelve cero ni divide por cero', () => {
    expect(contarEsqueletos(0)).toBeGreaterThan(0);
    expect(contarEsqueletos(Number.NaN)).toBeGreaterThan(0);
    expect(contarEsqueletos(3, 0)).toBeGreaterThan(0);
  });
});
