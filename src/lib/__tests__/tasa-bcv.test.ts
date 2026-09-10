import { describe, it, expect } from 'vitest';
import { formatRate } from '@/hooks/useExchangeRate';
import { normalizeRate } from '@/services/exchangeRate';
import type { ExchangeRate } from '@/types';

/**
 * El backend serializa `rate` como string (decimal de TypeORM) aunque el tipo
 * la declare `number`. Sin coacción, el chip de la cabecera mostraba `481.22`
 * en vez de `481,22` y el resumen de compra escondía la tasa por completo.
 */
describe('tasa BCV', () => {
  const payload = (rate: unknown) =>
    ({
      date: '2026-04-19',
      rate,
      source: 'bcv',
      createdAt: '2026-04-20T05:00:00.578Z',
      updatedAt: '2026-04-20T05:00:00.578Z',
    }) as unknown as ExchangeRate;

  it('normaliza a número la tasa que el backend manda como string', () => {
    const normalizada = normalizeRate(payload('481.22'));

    expect(normalizada.rate).toBe(481.22);
    expect(typeof normalizada.rate).toBe('number');
  });

  it('conserva el resto de campos al normalizar', () => {
    const normalizada = normalizeRate(payload('481.22'));

    expect(normalizada.date).toBe('2026-04-19');
    expect(normalizada.source).toBe('bcv');
  });

  it('formatea con coma decimal y punto de millares, como es-VE', () => {
    expect(formatRate(1481.2)).toBe('1.481,20');
  });

  it('formatea con coma aunque le llegue la tasa como string del backend', () => {
    // Regresión: String.prototype.toLocaleString ignora las opciones y devolvía
    // el texto crudo con punto decimal.
    expect(formatRate('481.22' as unknown as number)).toBe('481,22');
  });

  it('siempre muestra dos decimales', () => {
    expect(formatRate(120)).toBe('120,00');
  });
});
