import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * "undefined productos".
 *
 * Eso es lo que leía el cliente debajo de cada compra suya en "Mis pedidos".
 * `OrderSummary` declara `totalItems: number`, pero `GET /orders` NO manda ese
 * campo: en el backend es un getter del prototipo y le faltaba el `@Expose()`
 * que necesita `ClassSerializerInterceptor` para incluirlo (el mismo fallo que
 * ya se había corregido para el carrito). Y de paso `total` y `totalVes` llegan
 * como CADENA, no como número.
 *
 * # Por qué esta prueba existe habiendo ya `mis-pedidos.monto-dual.test.tsx`
 *
 * Porque aquélla se dobla el SERVICIO (`ordersService.getMyOrders`) y le da un
 * `OrderSummary` ya perfecto, con `totalItems: 2` y los montos en número. Con
 * ese doble la pantalla nunca ve la respuesta real, así que el fallo no podía
 * aparecer por mucho que se probara: el doble fijaba precisamente la forma que
 * NO llega.
 *
 * Aquí se dobla el escalón de más abajo —`apiClient`— con la respuesta LITERAL
 * del backend en ejecución. Así corre el adaptador de verdad y la prueba
 * atraviesa toda la cadena: HTTP crudo → servicio → pantalla.
 */

const get = vi.fn();
vi.mock('@/lib/api', () => ({
  apiClient: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn(), getBlob: vi.fn() },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uuid: 'u-1', firstName: 'Prueba' }, loading: false }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Copia literal de un elemento de `GET /orders`. Sin `totalItems`, sin
 * `shippingVes`, y con todos los montos como texto. No se "simplifica": la
 * gracia de la prueba es que sea exactamente lo que manda el servidor.
 */
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
  items: [
    {
      uuid: '680f49ab-32fe-456c-99d0-7481e7815d3b',
      productName: 'PINT ESMALTE BRILL GRIS CLARO 1G ARADOS VERONA',
      productSku: '30365',
      quantity: 3,
      price: '37.12',
      priceVes: '17862.89',
      subtotal: '111.36',
      subtotalVes: '53588.67',
    },
  ],
};

const cargar = async () => {
  const mod = await import('@/app/mi-cuenta/ordenes/page');
  const Pagina = mod.default;
  return render(<Pagina />);
};

describe('Mis pedidos · contra la respuesta real de la API', () => {
  beforeEach(() => {
    get.mockReset();
    vi.resetModules();
  });

  it('no escribe "undefined productos" debajo de la compra', async () => {
    get.mockResolvedValue([PEDIDO_CRUDO]);

    await cargar();

    await waitFor(() => {
      expect(screen.getByText(/ORD-MSA0K346-LP53/)).toBeTruthy();
    });

    expect(document.body.textContent).not.toContain('undefined');
    expect(document.body.textContent).toContain('3 productos');
  });

  /**
   * Honestidad sobre el alcance de esta prueba: NO discrimina si el monto se
   * normalizó o no. `formatCurrency` acepta `number | string` y hace
   * `parseFloat`, así que la cifra sale bien formateada en los dos casos —se
   * comprobó saboteando la normalización de `totalVes`, y esta prueba siguió
   * pasando.
   *
   * Se queda porque sí protege la salida que ve el cliente (coma decimal,
   * punto de millares, nada de NaN). La garantía de TIPO, que es la que impide
   * que una suma futura concatene, vive en
   * `services/__tests__/orders.normalizacion.test.ts`, donde sí se comprueba
   * con `typeof`.
   */
  it('muestra el importe en bolívares pese a que llegue como texto', async () => {
    get.mockResolvedValue([PEDIDO_CRUDO]);

    await cargar();

    await waitFor(() => {
      expect(screen.getByText(/ORD-MSA0K346-LP53/)).toBeTruthy();
    });

    // Convención venezolana: coma decimal y punto de millares. Con el monto
    // como cadena, `toLocaleString` habría devuelto "17862.89" tal cual.
    expect(document.body.textContent).toContain('17.862,89');
    expect(document.body.textContent).not.toContain('NaN');
  });
});
