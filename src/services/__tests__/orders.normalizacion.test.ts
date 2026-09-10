import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from '@/types';

/**
 * Que los tipos de la API digan la verdad.
 *
 * # Por qué estos datos y no unos inventados
 *
 * Estas pruebas usan la forma REAL de la respuesta, capturada del backend en
 * ejecución (`GET /orders`, `GET /orders/track/:n`), con los montos como
 * CADENA y sin `totalItems` ni `shippingVes`. Escribirlas con un doble que ya
 * devolviera números no probaría absolutamente nada: el fallo consiste
 * justamente en que lo real no coincide con lo declarado, así que un doble
 * "correcto" fija el bug en vez de cazarlo.
 *
 * Por eso los objetos de abajo se declaran con `as unknown as Order`: escritos
 * con su tipo verdadero, TypeScript rechazaría `total: "37.12"` — y esa
 * incomodidad es exactamente el síntoma que estamos documentando.
 */

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();
vi.mock('@/lib/api', () => ({
  apiClient: { get, post, patch, delete: del, getBlob: vi.fn() },
}));

const { ordersService } = await import('../orders');

/** Copia literal de un pedido de `GET /orders` del backend real. */
const PEDIDO_CRUDO = {
  uuid: 'eaefcbca-f7e1-40b7-9639-21541fa8c725',
  orderNumber: 'ORD-MSA0K346-LP53',
  status: 'completed',
  createdAt: '2026-08-01T06:51:54.439Z',
  deliveryMethod: 'pickup',
  subtotal: '32.00',
  subtotalVes: '15399.04',
  tax: '5.12',
  taxVes: '2463.85',
  shipping: '0.00',
  discountAmount: '0.00',
  discountAmountVes: '0.00',
  total: '37.12',
  totalVes: '17862.89',
  exchangeRate: '481.22',
  // Ojo: `totalItems` y `shippingVes` NO aparecen. No es un olvido de la
  // prueba: el backend no los manda.
  items: [
    {
      uuid: '680f49ab-32fe-456c-99d0-7481e7815d3b',
      productName: 'PINT ESMALTE BRILL GRIS CLARO 1G ARADOS VERONA',
      productSku: '30365',
      quantity: 1,
      price: '37.12',
      priceVes: '17862.89',
      subtotal: '37.12',
      subtotalVes: '17862.89',
    },
  ],
} as unknown as Order;

describe('ordersService: los montos del pedido llegan como texto', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
  });

  it('convierte a número los montos de `getOrderByUuid`', async () => {
    get.mockResolvedValue(PEDIDO_CRUDO);

    const pedido = await ordersService.getOrderByUuid('eaefcbca');

    expect(pedido.total).toBe(37.12);
    expect(pedido.subtotal).toBe(32);
    expect(pedido.tax).toBe(5.12);
    expect(pedido.shipping).toBe(0);
    expect(pedido.totalVes).toBe(17862.89);
    expect(pedido.subtotalVes).toBe(15399.04);
    expect(pedido.exchangeRate).toBe(481.22);

    // No basta con que el valor sea igual: `"37.12" == 37.12` es cierto en JS.
    // Lo que se fija aquí es el TIPO, que es lo que el resto de la aplicación
    // cree tener.
    expect(typeof pedido.total).toBe('number');
    expect(typeof pedido.exchangeRate).toBe('number');
  });

  it('suma las unidades del pedido cuando el backend no manda `totalItems`', async () => {
    get.mockResolvedValue({
      ...PEDIDO_CRUDO,
      items: [
        { ...PEDIDO_CRUDO.items[0], quantity: 3 },
        { ...PEDIDO_CRUDO.items[0], uuid: 'otro', quantity: 4 },
      ],
    });

    const pedido = await ordersService.getOrderByUuid('eaefcbca');

    // Sin esto, "Mis pedidos" escribía "undefined productos".
    expect(pedido.totalItems).toBe(7);
  });

  it('deja el listado de "Mis pedidos" con total y unidades utilizables', async () => {
    get.mockResolvedValue([PEDIDO_CRUDO]);

    const [resumen] = await ordersService.getMyOrders();

    expect(resumen.total).toBe(37.12);
    expect(resumen.totalVes).toBe(17862.89);
    expect(resumen.totalItems).toBe(1);
    expect(`${resumen.totalItems} productos`).toBe('1 productos');
  });

  it('conserva el nulo de los montos en Bs. de los pedidos viejos', async () => {
    // Un pedido real anterior a que se guardara el equivalente en bolívares.
    get.mockResolvedValue({
      ...PEDIDO_CRUDO,
      total: '9.00',
      totalVes: null,
      subtotalVes: null,
      taxVes: null,
      exchangeRate: null,
    });

    const pedido = await ordersService.getOrderByUuid('x');

    // Aplanarlos a 0 haría que la pantalla mostrara "Bs. 0,00" como si la
    // compra no hubiera costado nada, en vez de caer al dólar.
    expect(pedido.totalVes).toBeNull();
    expect(pedido.exchangeRate).toBeNull();
    expect(pedido.total).toBe(9);
  });

  it('normaliza también los renglones', async () => {
    get.mockResolvedValue(PEDIDO_CRUDO);

    const pedido = await ordersService.getOrderByUuid('x');

    expect(pedido.items[0].subtotal).toBe(37.12);
    expect(pedido.items[0].subtotalVes).toBe(17862.89);
    expect(typeof pedido.items[0].subtotal).toBe('number');
  });

  /**
   * La suma es la operación que delata la mentira. Con cadenas,
   * `"32.00" + "5.12"` es `"32.005.12"`; el resto del código se salvaba porque
   * sólo multiplicaba o comparaba.
   */
  it('permite sumar los montos sin que se concatenen', async () => {
    get.mockResolvedValue(PEDIDO_CRUDO);

    const pedido = await ordersService.getOrderByUuid('x');

    expect(pedido.subtotal + pedido.tax + pedido.shipping).toBe(37.12);
  });
});

describe('ordersService.trackOrder: el seguimiento público', () => {
  /** Copia literal de `GET /orders/track/ORD-MSA0K346-LP53`, sin sesión. */
  const SEGUIMIENTO_CRUDO = {
    orderNumber: 'ORD-MSA0K346-LP53',
    status: 'completed',
    deliveryMethod: 'pickup',
    createdAt: '2026-08-01T06:51:54.439Z',
    dateCompleted: '2026-08-01T10:30:00.000Z',
    subtotal: '32.00',
    tax: '5.12',
    shipping: '0.00',
    discountAmount: '0.00',
    total: '37.12',
    exchangeRate: '481.22',
    exchangeRateDate: '2026-04-19',
    subtotalVes: '15399.04',
    taxVes: '2463.85',
    discountAmountVes: '0.00',
    totalVes: '17862.89',
    paymentInfo: { method: 'pagomovil', status: 'pending' },
    items: [
      {
        uuid: '680f49ab-32fe-456c-99d0-7481e7815d3b',
        productName: 'PINT ESMALTE BRILL GRIS CLARO 1G ARADOS VERONA',
        productSku: '30365',
        quantity: 1,
        price: '37.12',
        priceVes: '17862.89',
        subtotal: '37.12',
        subtotalVes: '17862.89',
      },
    ],
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SEGUIMIENTO_CRUDO,
      }),
    );
  });

  it('convierte a número los montos del seguimiento', async () => {
    const pedido = await ordersService.trackOrder('ORD-MSA0K346-LP53');

    expect(pedido.total).toBe(37.12);
    expect(pedido.totalVes).toBe(17862.89);
    expect(pedido.exchangeRate).toBe(481.22);
    expect(pedido.items[0].subtotal).toBe(37.12);
    expect(typeof pedido.total).toBe('number');
  });

  /**
   * El corazón del arreglo de `TrackedOrder`.
   *
   * El tipo se declaraba `Omit<Order, "paymentInfo">`, o sea afirmaba traer
   * `uuid`, `shippingAddress`, `trackingNumber`, `notes`, `updatedAt`… de una
   * respuesta que se obtiene con SÓLO el número de pedido y sin sesión. El
   * backend no manda nada de eso a propósito (ver `OrderTrackingDto`), y esta
   * prueba fija que la respuesta real efectivamente no los trae — para que si
   * alguien vuelve a declararlos, quede claro contra qué se está mintiendo.
   */
  it('no trae los campos que el DTO público recorta', async () => {
    const pedido = await ordersService.trackOrder('ORD-MSA0K346-LP53');

    for (const campo of [
      'uuid',
      'userId',
      'updatedAt',
      'notes',
      'trackingNumber',
      'shippingAddress',
      'shippingVes',
      'discountCode',
      'totalItems',
      'guestCustomer',
      'user',
    ]) {
      expect(pedido).not.toHaveProperty(campo);
    }
  });

  it('del pago sólo expone método y estado', async () => {
    const pedido = await ordersService.trackOrder('ORD-MSA0K346-LP53');

    expect(pedido.paymentInfo).toEqual({
      method: 'pagomovil',
      status: 'pending',
    });
  });
});
