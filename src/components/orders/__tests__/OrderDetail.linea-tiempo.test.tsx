import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderDetail } from '@/components/orders/OrderDetail';
import type { Order, TrackedOrder } from '@/types';

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

// Lo que de verdad llega al seguimiento público: sin `verifiedAt`.
const publico = {
  ...conSesion,
  paymentInfo: { method: 'pagomovil', status: 'verified' },
} as unknown as TrackedOrder;

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
