import { describe, it, expect } from 'vitest';
import {
  formatComparisonLabel,
  formatMonthLabel,
  formatMonthName,
} from '../month-label';

/**
 * La cabecera del bloque de ventas dice de qué mes habla. El backend manda
 * "2026-09"; leerlo con `new Date('2026-09')` lo interpreta como medianoche
 * UTC, que en Venezuela (UTC-4) es el 31 de agosto: la cabecera habría dicho
 * "agosto 2026" encima de las ventas de septiembre.
 */
describe('formatMonthLabel', () => {
  it('traduce el mes sin correrse por la zona horaria', () => {
    expect(formatMonthLabel('2026-09')).toBe('septiembre 2026');
    expect(formatMonthLabel('2026-01')).toBe('enero 2026');
    expect(formatMonthLabel('2026-12')).toBe('diciembre 2026');
  });

  it('no se cae con una cadena que no tiene la forma esperada', () => {
    expect(formatMonthLabel('')).toBe('');
    expect(formatMonthLabel('2026-13')).toBe('2026-13');
    expect(formatMonthLabel('septiembre')).toBe('septiembre');
  });
});

/**
 * El bloque enseña lo que va del mes y el backend calcula el porcentaje contra
 * los mismos días del mes anterior. Si el rótulo dijera "vs mes anterior" a
 * secas, el dueño leería nueve días contra un mes cerrado.
 */
describe('formatComparisonLabel', () => {
  it('nombra los días del tramo y el mes con el que compara', () => {
    expect(formatComparisonLabel(9, '2026-08')).toBe(
      'vs los primeros 9 días de agosto',
    );
    expect(formatComparisonLabel(5, '2026-12')).toBe(
      'vs los primeros 5 días de diciembre',
    );
  });

  it('el día 1 se dice en singular, no "los primeros 1 días"', () => {
    expect(formatComparisonLabel(1, '2026-08')).toBe('vs el primer día de agosto');
  });

  it('rotula un tramo recortado, que es más corto que el mes en curso', () => {
    // El 31 de marzo el backend recorta el tramo a los 28 días de febrero y es
    // ESE número el que llega aquí. La función no tiene que saber recortar —lo
    // hace quien calcula—, pero sí tiene que pintar lo que le dan sin
    // redondear hacia el mes en curso.
    expect(formatComparisonLabel(28, '2026-02')).toBe(
      'vs los primeros 28 días de febrero',
    );
    expect(formatComparisonLabel(29, '2028-02')).toBe(
      'vs los primeros 29 días de febrero',
    );
  });
});

describe('formatMonthName', () => {
  it('da el mes sin el año, para meterlo en una frase', () => {
    expect(formatMonthName('2026-08')).toBe('agosto');
    expect(formatMonthName('2026-01')).toBe('enero');
  });

  it('devuelve la cadena original si no la reconoce', () => {
    expect(formatMonthName('agosto')).toBe('agosto');
    expect(formatMonthName('2026-00')).toBe('2026-00');
  });
});
