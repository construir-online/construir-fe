import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderDetail } from '@/components/orders/OrderDetail';
import type { Order, TrackedOrder } from '@/types';
import { PaymentMethod } from '@/lib/enums';

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * La línea de tiempo se alimenta sólo de marcas de tiempo reales. El
 * seguimiento público recibe menos campos que la vista con sesión —su DTO no
 * manda `verifiedAt`— y aun así tiene que dibujarse, sin fecha en esa etapa.
 */
const items = [
  {
    uuid: 'i-1',
    productName: 'Saco de cemento gris',
    productSku: 'CEM-425',
    quantity: 2,
    price: '12.50',
    subtotal: 25,
    subtotalVes: 12030.5,
  },
];

const conSesion = {
  uuid: 'o-1',
  orderNumber: 'ORD-PRUEBA-0001',
  status: 'processing',
  deliveryMethod: 'delivery',
  createdAt: '2026-08-01T10:24:00.000Z',
  dateCompleted: null,
  items,
  subtotal: 32,
  subtotalVes: 15399.04,
  tax: 5.12,
  taxVes: 2463.85,
  shipping: 0,
  shippingVes: null,
  total: 37.12,
  totalVes: 17862.89,
  exchangeRate: 481.22,
  totalItems: 2,
  shippingAddress: null,
  paymentInfo: {
    method: 'pagomovil',
    status: 'verified',
    verifiedAt: '2026-08-01T12:00:00.000Z',
  },
} as unknown as Order;

/**
 * Lo que de verdad llega al seguimiento público.
 *
 * Antes esto era `{ ...conSesion, paymentInfo: {…} }`, y por tanto NO probaba
 * el seguimiento: arrastraba `uuid`, `shippingAddress`, `shippingVes` y
 * `totalItems`, que el DTO público no manda. El `as unknown as` impedía que
 * TypeScript lo notara. La prueba pasaba, pero contra una forma que no existe.
 *
 * Ahora es copia literal de `GET /orders/track/:n`, ya normalizado por
 * `ordersService.trackOrder` (montos en número). Ver `OrderTrackingDto`.
 */
const publico: TrackedOrder = {
  orderNumber: 'ORD-PRUEBA-0001',
  status: 'processing',
  deliveryMethod: 'delivery',
  createdAt: '2026-08-01T10:24:00.000Z',
  dateCompleted: null,
  subtotal: 32,
  tax: 5.12,
  shipping: 0,
  discountAmount: 0,
  total: 37.12,
  exchangeRate: 481.22,
  exchangeRateDate: '2026-04-19',
  subtotalVes: 15399.04,
  taxVes: 2463.85,
  discountAmountVes: 0,
  totalVes: 17862.89,
  paymentInfo: { method: PaymentMethod.PAGO_MOVIL, status: 'verified' },
  items: [
    {
      uuid: 'i-1',
      productName: 'Saco de cemento gris',
      productSku: 'CEM-425',
      quantity: 2,
      price: 12.5,
      priceVes: 6015.25,
      subtotal: 25,
      subtotalVes: 12030.5,
    },
  ],
};

describe('OrderDetail · línea de tiempo', () => {
  it('dibuja las cuatro etapas en la vista con sesión', () => {
    render(<OrderDetail order={conSesion} />);

    expect(screen.getByText('stageReceived')).toBeTruthy();
    expect(screen.getByText('stagePaymentVerified')).toBeTruthy();
    expect(screen.getByText('stageOnTheWay')).toBeTruthy();
    expect(screen.getByText('stageDelivered')).toBeTruthy();
  });

  it('también la dibuja en el seguimiento público, sin datos de pago', () => {
    render(<OrderDetail order={publico} showPaymentDetails={false} />);

    expect(screen.getByText('stageReceived')).toBeTruthy();
    expect(screen.getByText('stageOnTheWay')).toBeTruthy();
  });

  it('nombra las etapas de retiro sin hablar de tránsito', () => {
    const retiro = { ...conSesion, deliveryMethod: 'pickup' } as unknown as Order;
    render(<OrderDetail order={retiro} />);

    // Regla de producto: no hay guía ni encomienda.
    expect(screen.getByText('stageReadyForPickup')).toBeTruthy();
    expect(screen.queryByText('stageOnTheWay')).toBeNull();
  });

  it('no dibuja línea de tiempo en un pedido cancelado', () => {
    const cancelado = { ...conSesion, status: 'cancelled' } as unknown as Order;
    render(<OrderDetail order={cancelado} />);

    expect(screen.queryByText('stageReceived')).toBeNull();
  });
});
