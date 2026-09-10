import { apiClient } from '@/lib/api';
import type { ExchangeRate } from '@/types';

/**
 * El backend serializa `rate` como string (columna decimal de TypeORM), pero el
 * tipo `ExchangeRate` la declara `number`. Sin normalizar, la tasa se propaga
 * como string y rompe dos cosas a la vez: `toLocaleString('es-VE')` sobre un
 * string devuelve el texto tal cual (`481.22` en vez de `481,22`), y los
 * guardas `typeof === 'number'` del resumen de compra esconden la tasa BCV, que
 * el diseño exige tener siempre a la vista junto al monto dual.
 */
export function normalizeRate(rate: ExchangeRate): ExchangeRate {
  return { ...rate, rate: Number(rate.rate) };
}

class ExchangeRateService {
  private cachedRate: ExchangeRate | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en millisegundos

  /**
   * Obtiene el tipo de cambio actual desde el backend
   * Incluye caché de 5 minutos para reducir llamadas al servidor
   */
  async getCurrentRate(): Promise<ExchangeRate> {
    const now = Date.now();

    // Retornar caché si está vigente
    if (this.cachedRate && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return this.cachedRate;
    }

    try {
      const rate = normalizeRate(
        await apiClient.get<ExchangeRate>('/exchange-rates/current'),
      );
      this.cachedRate = rate;
      this.cacheTimestamp = now;
      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);

      // Si hay caché antiguo, usarlo como fallback
      if (this.cachedRate) {
        console.warn('Using cached exchange rate as fallback');
        return this.cachedRate;
      }

      throw error;
    }
  }

  /**
   * Forzar actualización del caché (útil después de sincronización manual)
   */
  clearCache(): void {
    this.cachedRate = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Convertir monto de USD a VES
   */
  async convertUsdToVes(amountUsd: number): Promise<number> {
    const rate = await this.getCurrentRate();
    return amountUsd * rate.rate;
  }

  /**
   * Convertir monto de VES a USD
   */
  async convertVesToUsd(amountVes: number): Promise<number> {
    const rate = await this.getCurrentRate();
    return amountVes / rate.rate;
  }
}

export const exchangeRateService = new ExchangeRateService();
