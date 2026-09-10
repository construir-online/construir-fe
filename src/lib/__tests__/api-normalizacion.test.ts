import { describe, it, expect, vi, afterEach } from 'vitest';
import { aNumero, aNumeroONulo, avisarSiDiverge } from '../api-normalizacion';

describe('aNumero', () => {
  it('convierte las cadenas decimales que manda TypeORM', () => {
    expect(aNumero('37.12')).toBe(37.12);
    expect(aNumero('0.00')).toBe(0);
    expect(aNumero('481.22')).toBe(481.22);
    expect(aNumero('193700.68')).toBe(193700.68);
  });

  it('deja pasar los números que ya vienen bien', () => {
    expect(aNumero(37.12)).toBe(37.12);
    expect(aNumero(0)).toBe(0);
  });

  /**
   * Un hueco vale cero, igual que en `parsePrice`. Propagar un `NaN` haría que
   * el cliente leyera "NaN" en mitad de un total, que es peor que un cero.
   */
  it('trata los huecos y la basura como cero, nunca como NaN', () => {
    expect(aNumero(null)).toBe(0);
    expect(aNumero(undefined)).toBe(0);
    expect(aNumero('')).toBe(0);
    expect(aNumero('no soy un número')).toBe(0);
    expect(aNumero(NaN)).toBe(0);
    expect(aNumero(Infinity)).toBe(0);
    expect(aNumero({})).toBe(0);
  });
});

describe('aNumeroONulo', () => {
  it('convierte igual que aNumero cuando hay valor', () => {
    expect(aNumeroONulo('17862.89')).toBe(17862.89);
  });

  /**
   * La distinción que importa: en los montos en bolívares, `null` significa
   * "pedido anterior a que se guardara el equivalente en Bs." y la interfaz
   * cae al dólar. Un `0` diría que la compra no costó nada.
   */
  it('conserva el nulo en vez de aplanarlo a cero', () => {
    expect(aNumeroONulo(null)).toBeNull();
    expect(aNumeroONulo(undefined)).toBeNull();
  });

  it('sí devuelve cero para un cero de verdad', () => {
    expect(aNumeroONulo('0.00')).toBe(0);
    expect(aNumeroONulo(0)).toBe(0);
  });
});

describe('avisarSiDiverge', () => {
  afterEach(() => vi.unstubAllGlobals());

  const espiarConsola = () => {
    const warn = vi.fn();
    vi.stubGlobal('console', { ...console, warn });
    return warn;
  };

  it('avisa cuando un campo declarado número llega como cadena', () => {
    const warn = espiarConsola();

    avisarSiDiverge('GET /orders', { total: '37.12' }, { total: 'number' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('total');
    expect(warn.mock.calls[0][0]).toContain('string');
  });

  it('avisa cuando un campo declarado no viaja en la respuesta', () => {
    const warn = espiarConsola();

    avisarSiDiverge('GET /orders', { total: 37.12 }, { totalItems: 'number' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('NO viaja');
  });

  it('calla cuando la forma real coincide con la declarada', () => {
    const warn = espiarConsola();

    avisarSiDiverge('GET /orders', { total: 37.12 }, { total: 'number' });

    expect(warn).not.toHaveBeenCalled();
  });

  /**
   * Un nulo declarado es una ausencia legítima (los montos en Bs. de los
   * pedidos viejos), no una divergencia de contrato: avisar de eso llenaría la
   * consola de ruido y acabaría enseñando a ignorar el aviso.
   */
  it('no avisa por un nulo, que es una ausencia legítima', () => {
    const warn = espiarConsola();

    avisarSiDiverge('GET /orders', { totalVes: null }, { totalVes: 'number' });

    expect(warn).not.toHaveBeenCalled();
  });
});
