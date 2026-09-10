/**
 * Utilidades para formateo y manejo de monedas
 */

export type Currency = 'USD' | 'VES';

/**
 * Formatea un monto con el símbolo de moneda apropiado
 */
export function formatCurrency(amount: number | string, currency: Currency): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return currency === 'USD' ? '$0.00' : 'Bs. 0,00';
  }

  if (currency === 'USD') {
    // PENDIENTE DE DECIDIR: el diseño pide el dólar también en formato
    // venezolano (`$41,80`), y hoy se lee «Bs. 14.513,52 · $30.16», con dos
    // convenciones para el mismo número en la misma línea. No se cambia aquí
    // porque este helper lo comparte el panel de administración, que tiene
    // pruebas fijando `$150.00`.
    return `$${numAmount.toFixed(2)}`;
  } else {
    // VES con formato venezolano (coma para decimales, punto para miles)
    return `Bs. ${numAmount.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}

/**
 * Formatea un precio en USD
 */
export function formatUSD(amount: number | string): string {
  return formatCurrency(amount, 'USD');
}

/**
 * Formatea un precio en VES (Bolívares)
 */
export function formatVES(amount: number | string): string {
  return formatCurrency(amount, 'VES');
}

/**
 * Obtiene el símbolo de la moneda
 */
export function getCurrencySymbol(currency: Currency): string {
  return currency === 'USD' ? '$' : 'Bs.';
}

/**
 * Obtiene el nombre de la moneda
 */
export function getCurrencyName(currency: Currency): string {
  return currency === 'USD' ? 'Dólares' : 'Bolívares';
}

/**
 * Convierte string a número de forma segura
 */
export function parsePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
}
