import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Discount } from '@/types';

/**
 * El cupón que no se podía guardar.
 *
 * `value`, `minPurchaseAmount` y `maxDiscountAmount` son columnas `numeric`, y
 * la API las devuelve como cadena aunque `Discount` las declare `number`. El
 * formulario de edición cargaba esas cadenas en su estado y las devolvía tal
 * cual en el PATCH; el backend, que exige `@IsNumber()`, respondía 400:
 *
 *     "value must be a number conforming to the specified constraints"
 *
 * Comprobado contra el backend real: un PATCH con los MISMOS valores que la API
 * acababa de devolver —sin cambiar nada— devuelve 400.
 *
 * Los datos de abajo son la respuesta literal de `GET /discounts`. Van con
 * `as unknown as Discount` porque escritos con su tipo verdadero TypeScript los
 * rechazaría, que es justo la mentira que documentan.
 */

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock('@/lib/api', () => ({
  apiClient: { get, post, patch, delete: vi.fn() },
}));

const { discountsService } = await import('../discounts');

const CUPON_CRUDO = {
  uuid: '24358b3f-e2fa-4eaa-9af3-32434445dbe6',
  code: 'DIODI',
  description: 'Dolor quod vel elit',
  type: 'percentage',
  value: '5.00',
  minPurchaseAmount: '10.00',
  maxDiscountAmount: '15.00',
  maxUses: 20,
  currentUses: 0,
  isActive: true,
  createdAt: '2025-11-10T14:43:09.235Z',
  updatedAt: '2025-11-10T14:43:09.235Z',
} as unknown as Discount;

describe('discountsService: los importes del cupón llegan como texto', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('convierte a número los importes del listado', async () => {
    get.mockResolvedValue([CUPON_CRUDO]);

    const [cupon] = await discountsService.getAll();

    expect(cupon.value).toBe(5);
    expect(cupon.minPurchaseAmount).toBe(10);
    expect(cupon.maxDiscountAmount).toBe(15);
    expect(typeof cupon.value).toBe('number');
    expect(typeof cupon.minPurchaseAmount).toBe('number');
    expect(typeof cupon.maxDiscountAmount).toBe('number');
  });

  /**
   * Éste es el fallo que veía el administrador, no una sutileza de tipos: lo
   * que el formulario carga es lo que reenvía, así que si carga `"5.00"`
   * reenvía `"5.00"` y el guardado se cae con un 400.
   */
  it('deja el cupón en una forma que el backend acepta de vuelta', async () => {
    get.mockResolvedValue(CUPON_CRUDO);

    const cupon = await discountsService.getByUuid('24358b3f');

    // Lo que el formulario mandaría en el PATCH, tal cual lo cargó.
    const aEnviar = {
      value: cupon.value,
      minPurchaseAmount: cupon.minPurchaseAmount,
      maxDiscountAmount: cupon.maxDiscountAmount,
    };

    // El `ValidationPipe` del backend corre sin `enableImplicitConversion`:
    // una cadena numérica NO pasa `@IsNumber()`.
    for (const [campo, valor] of Object.entries(aEnviar)) {
      expect(typeof valor, `${campo} se envía como ${typeof valor}`).toBe(
        'number',
      );
    }
  });

  it('no se inventa un umbral cuando el cupón no tiene mínimo ni máximo', async () => {
    get.mockResolvedValue([
      {
        ...CUPON_CRUDO,
        minPurchaseAmount: null,
        maxDiscountAmount: null,
        maxUses: null,
      },
    ]);

    const [cupon] = await discountsService.getAll();

    // Un `0` aquí sería un umbral inventado: "compra mínima de $0" no es lo
    // mismo que "sin compra mínima", y `maxUses: 0` sería un cupón agotado.
    expect(cupon.minPurchaseAmount).toBeNull();
    expect(cupon.maxDiscountAmount).toBeNull();
    expect(cupon.maxUses).toBeNull();
  });

  it('formatea el valor en convención venezolana una vez normalizado', async () => {
    get.mockResolvedValue([CUPON_CRUDO]);

    const [cupon] = await discountsService.getAll();

    // El listado interpolaba la cadena cruda y se leía "5.00%" y "$5.00", con
    // punto decimal anglosajón, en el único sitio del panel que no pasa por
    // `formatCurrency`.
    expect(`${cupon.value}%`).toBe('5%');
  });
});
