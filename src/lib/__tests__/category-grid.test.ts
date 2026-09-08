import { describe, it, expect } from 'vitest';
import {
  CATEGORY_GRID_CLASS,
  CATEGORY_GRID_MAX_COLS,
  FEATURED_MAX,
  columnasDestacadas,
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
    ]) {
      expect(CATEGORY_GRID_CLASS).toContain(clase);
    }
  });

  it('declara como máximo el número de columnas que dice CATEGORY_GRID_MAX_COLS', () => {
    // Si alguien añade un `2xl:grid-cols-8` y olvida la constante, el número de
    // esqueletos deja de cuadrar con las columnas y la última fila queda coja.
    const columnas = [...CATEGORY_GRID_CLASS.matchAll(/grid-cols-(\d+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...columnas)).toBe(CATEGORY_GRID_MAX_COLS);
  });

  it('no pasa de 7 columnas, porque el contenedor deja de crecer en xl', () => {
    // Con `max-w-7xl`, una octava columna repartía el MISMO ancho entre más
    // tarjetas: de 160px a 138px, y volvían a truncarse nombres que a 1280 se
    // leían enteros. Más pantalla no puede dar menos legibilidad.
    expect(CATEGORY_GRID_MAX_COLS).toBeLessThanOrEqual(7);
  });
});

describe('columnasDestacadas', () => {
  it('usa tantas columnas como categorías, así que nunca sobra hueco', () => {
    // El bug original era un número FIJO de columnas: cuatro dejaba tres huecos
    // con cinco destacadas, y seis (el primer intento de arreglo) dejaba uno,
    // porque el backend devuelve cinco y no seis.
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(columnasDestacadas(n)).toBe(n);
    }
  });

  it('no pasa del tope aunque el backend mande de más', () => {
    expect(columnasDestacadas(20)).toBe(FEATURED_MAX);
    expect(columnasDestacadas(7)).toBe(FEATURED_MAX);
  });

  it('nunca devuelve cero: `repeat(0, …)` deja la rejilla sin columnas', () => {
    expect(columnasDestacadas(0)).toBe(1);
    expect(columnasDestacadas(-4)).toBe(1);
    expect(columnasDestacadas(Number.NaN)).toBe(1);
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
