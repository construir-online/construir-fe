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
    return currency === 'USD' ? '$0,00' : 'Bs. 0,00';
  }

  // Las dos monedas van en convención venezolana: coma decimal y punto de
  // millares. El criterio NO se toma del diseño —el lienzo es incoherente
  // consigo mismo, escribe la tasa como `118.32` junto a `Bs. 4.946,00`— sino
  // de quien lee el número: el cliente venezolano. Por eso se aplica sin
  // excepciones, panel de administración incluido; tener dos criterios
  // conviviendo es justo como nacen estas divergencias.
  const formateado = numAmount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency === 'USD' ? `$${formateado}` : `Bs. ${formateado}`;
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
