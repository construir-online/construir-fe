import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { OrderSummary } from '@/types';

/**
 * El listado de pedidos mostraba sólo dólares (`$37.12`), sin rastro del Bs.
 * Es la pantalla a la que vuelve el cliente después de pagar, y el importe que
 * pagó —el que puede cotejar con su banco— es el de bolívares.
 */
const getMyOrders = vi.fn<() => Promise<OrderSummary[]>>();

vi.mock('@/services/orders', () => ({
  ordersService: { getMyOrders: () => getMyOrders() },
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

const pedido = (over: Partial<OrderSummary> = {}): OrderSummary => ({
  uuid: 'o-1',
  orderNumber: 'ORD-PRUEBA-0001',
  status: 'processing',
  total: 37.12,
  totalVes: 17862.89,
  totalItems: 2,
  createdAt: '2026-08-01T06:51:54.439Z',
  ...over,
} as OrderSummary);

const cargar = async () => {
  const mod = await import('@/app/mi-cuenta/ordenes/page');
  const Pagina = mod.default;
  return render(<Pagina />);
};

describe('Mis pedidos · monto dual', () => {
  beforeEach(() => {
    getMyOrders.mockReset();
    // La página se carga con `import()` dinámico; sin resetear el registro se
    // reutiliza la copia que dejó cacheada otro fichero de pruebas, con sus
    // mocks, y estas aserciones fallan sólo al correr la suite entera.
    vi.resetModules();
  });

  it('muestra el total en bolívares', async () => {
    getMyOrders.mockResolvedValue([pedido()]);
    await cargar();

    await waitFor(() => expect(screen.getByText('Bs. 17.862,89')).toBeTruthy());
  });

  it('acompaña el bolívar con el dólar de referencia', async () => {
    getMyOrders.mockResolvedValue([pedido()]);
    await cargar();

    await waitFor(() => expect(screen.getByText('Bs. 17.862,89')).toBeTruthy());
    expect(screen.getByText('$37.12')).toBeTruthy();
  });

  it('cae al dólar solo cuando el pedido no trae el equivalente en Bs.', async () => {
    getMyOrders.mockResolvedValue([pedido({ totalVes: null })]);
    await cargar();

    await waitFor(() => expect(screen.getByText('$37.12')).toBeTruthy());
    expect(screen.queryByText(/^Bs\./)).toBeNull();
  });
});
