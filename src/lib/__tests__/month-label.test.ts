import { describe, it, expect } from 'vitest';
import { formatMonthLabel } from '../month-label';

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
