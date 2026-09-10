import { describe, it, expect } from 'vitest';
import { formatUSD, formatVES, formatCurrency } from '@/lib/currency';

/**
 * Un solo criterio de formato en toda la app, panel incluido: coma decimal y
 * punto de millares, la convención venezolana.
 *
 * El criterio no sale del diseño —el lienzo se contradice, escribe la tasa como
 * `118.32` junto a `Bs. 4.946,00`— sino de quien lee el número. Antes convivían
 * los dos: se leía «Bs. 14.513,52 · $30.16» en la misma línea.
 */
describe('convención de formato de moneda', () => {
  it('formatea el dólar con coma decimal', () => {
    expect(formatUSD(30.16)).toBe('$30,16');
  });

  it('usa punto de millares en el dólar', () => {
    expect(formatUSD(1234.5)).toBe('$1.234,50');
  });

  it('mantiene el bolívar en la misma convención', () => {
    expect(formatVES(14513.52)).toBe('Bs. 14.513,52');
  });

  it('aplica el mismo separador decimal a las dos monedas', () => {
    const usd = formatUSD(30.16);
    const ves = formatVES(30.16);

    expect(usd.endsWith(',16')).toBe(true);
    expect(ves.endsWith(',16')).toBe(true);
  });

  it('no deja ningún punto decimal suelto en el dólar', () => {
    // `$1.234,50` sí lleva punto, pero de millares: el último separador
    // —el decimal— tiene que ser siempre la coma.
    const salida = formatUSD(1234.5);
    expect(salida.lastIndexOf(',')).toBeGreaterThan(salida.lastIndexOf('.'));
  });

  it('acepta importes en string, como los serializa el backend', () => {
    expect(formatUSD('30.16')).toBe('$30,16');
    expect(formatVES('14513.52')).toBe('Bs. 14.513,52');
  });

  it('cae a cero con coma cuando el importe no es un número', () => {
    expect(formatCurrency('no-es-un-numero', 'USD')).toBe('$0,00');
    expect(formatCurrency('no-es-un-numero', 'VES')).toBe('Bs. 0,00');
  });
});
