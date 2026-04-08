import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';

// Importamos después del mock para que el servicio use el apiClient mockeado
// El servicio es una instancia de clase, así que necesitamos importarlo fresco
// usando una función factory para resetearlo entre tests

async function getService() {
  // Re-import para obtener instancia fresca con caché limpio
  vi.resetModules();
  const { exchangeRateService } = await import('../exchangeRate');
  return exchangeRateService;
}

const mockRate = { uuid: 'xr-1', rate: 40.5, source: 'manual', createdAt: new Date().toISOString() };

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('exchangeRateService.getCurrentRate', () => {
  it('hace fetch al backend en la primera llamada', async () => {
    const { exchangeRateService } = await import('../exchangeRate');
    exchangeRateService.clearCache();
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockRate);

    const result = await exchangeRateService.getCurrentRate();

    expect(apiClient.get).toHaveBeenCalledWith('/exchange-rates/current');
    expect(result).toEqual(mockRate);
  });

  it('retorna el caché sin hacer fetch en la segunda llamada inmediata', async () => {
    const { exchangeRateService } = await import('../exchangeRate');
    exchangeRateService.clearCache();
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockRate);

    await exchangeRateService.getCurrentRate();
    await exchangeRateService.getCurrentRate();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('hace un nuevo fetch después de clearCache()', async () => {
    const { exchangeRateService } = await import('../exchangeRate');
    exchangeRateService.clearCache();

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockRate)
      .mockResolvedValueOnce({ ...mockRate, rate: 41.0 });

    await exchangeRateService.getCurrentRate();
    exchangeRateService.clearCache();
    const result = await exchangeRateService.getCurrentRate();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(result.rate).toBe(41.0);
  });
});

describe('exchangeRateService.convertUsdToVes', () => {
  it('multiplica el monto por la tasa correctamente', async () => {
    const { exchangeRateService } = await import('../exchangeRate');
    exchangeRateService.clearCache();
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockRate);

    const result = await exchangeRateService.convertUsdToVes(10);

    expect(result).toBeCloseTo(405, 0); // 10 * 40.5
  });
});

describe('exchangeRateService.convertVesToUsd', () => {
  it('divide el monto entre la tasa correctamente', async () => {
    const { exchangeRateService } = await import('../exchangeRate');
    exchangeRateService.clearCache();
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockRate);

    const result = await exchangeRateService.convertVesToUsd(405);

    expect(result).toBeCloseTo(10, 1); // 405 / 40.5
  });
});
