import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { OrderDetail } from '@/components/orders/OrderDetail';
import type { Order } from '@/types';

vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

/**
 * El bolívar es el importe que el cliente paga; el dólar es sólo referencia.
 * El detalle de pedido y el seguimiento público —las dos vistas que comparten
 * este componente— lo mostraban al revés: el USD grande y en color de marca, y
 * el Bs. debajo en gris pequeño.
 */
const pedido = {
  uuid: 'o-1',
  orderNumber: 'ORD-PRUEBA-0001',
  status: 'completed',
  createdAt: '2026-08-01T06:51:54.439Z',
  items: [
    {
      uuid: 'i-1',
      productName: 'Saco de cemento gris',
      productSku: 'CEM-425',
      quantity: 2,
      price: '12.50',
      subtotal: 25,
      subtotalVes: 12030.5,
    },
  ],
  subtotal: 32,
  subtotalVes: 15399.04,
  tax: 5.12,
  taxVes: 2463.85,
  shipping: 0,
  shippingVes: null,
  total: 37.12,
  totalVes: 17862.89,
  exchangeRate: 481.22,
  totalItems: 1,
  shippingAddress: null,
  deliveryMethod: 'pickup',
  paymentMethod: 'pagomovil',
  paymentStatus: 'pending',
} as unknown as Order;

const totalDe = (contenedor: HTMLElement) =>
  contenedor.textContent?.replace(/\s+/g, ' ') ?? '';

describe('OrderDetail · orden del monto dual', () => {
  it('muestra el total en bolívares, no en dólares', () => {
    render(<OrderDetail order={pedido} />);

    expect(screen.getByText('Bs. 17.862,89')).toBeTruthy();
  });

  it('deja el dólar como referencia secundaria del total', () => {
    const { container } = render(<OrderDetail order={pedido} />);
    const bs = screen.getByText('Bs. 17.862,89');
    const bloque = bs.parentElement as HTMLElement;

    // El USD acompaña al Bs. dentro del mismo bloque de total.
    expect(within(bloque).getByText('$37,12')).toBeTruthy();
    expect(totalDe(container)).toContain('Bs. 17.862,89');
  });

  it('el bolívar del total va resaltado y el dólar en gris pequeño', () => {
    render(<OrderDetail order={pedido} />);
    const bs = screen.getByText('Bs. 17.862,89');
    const usd = screen.getByText('$37,12');

    expect(bs.className).toContain('text-brand-600');
    expect(usd.className).toContain('text-sand-600');
  });

  it('muestra el subtotal y el IVA en bolívares', () => {
    render(<OrderDetail order={pedido} />);

    expect(screen.getByText('Bs. 15.399,04')).toBeTruthy();
    expect(screen.getByText('Bs. 2.463,85')).toBeTruthy();
  });

  it('cae al dólar cuando el pedido no trae el equivalente en bolívares', () => {
    const viejo = { ...pedido, totalVes: null } as unknown as Order;
    render(<OrderDetail order={viejo} />);

    expect(screen.getByText('$37,12')).toBeTruthy();
    expect(screen.queryByText('Bs. 17.862,89')).toBeNull();
  });
});
