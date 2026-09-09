import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { DashboardStats } from '@/services/dashboard';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const getDashboardStats = vi.fn();
const getProductStats = vi.fn();
const getLowStock = vi.fn();

vi.mock('@/services/dashboard', () => ({
  dashboardService: {
    getDashboardStats: () => getDashboardStats(),
  },
}));

vi.mock('@/services/products', () => ({
  productsService: {
    getStats: () => getProductStats(),
    getLowStock: () => getLowStock(),
  },
}));

import AdminDashboard from '../page';

/**
 * El bloque "Ventas e Ingresos del Mes" decía siempre "No hay datos
 * disponibles", para todos los roles. El panel exigía
 * `currentMonth.total/.count/.percentageChangeVes`, campos que
 * `GET /orders/admin/stats` —el único endpoint que consulta— nunca envió: la
 * respuesta real trae `verifiedRevenue`, `verifiedOrders` y compañía. Nadie lo
 * notó porque `apiClient.get<DashboardStats>` no valida nada y el tipo del
 * frontend estaba inventado.
 *
 * Estas pruebas montan el panel con la respuesta REAL del backend y exigen
 * que las tres tarjetas pinten esos números. Si alguien vuelve a renombrar un
 * campo por un lado y no por el otro, esto se cae en vez de vaciar el bloque
 * en silencio.
 */
describe('Panel de administración — Ventas e Ingresos del Mes', () => {
  /** Copia fiel de lo que devuelve `GET /orders/admin/stats`. */
  const respuestaDelBackend = (
    over: Partial<DashboardStats> = {},
  ): DashboardStats => ({
    totalOrders: 14,
    todayOrders: 1,
    monthOrders: 2,
    ordersByStatus: {
      'on-hold': 3,
      pending: 0,
      completed: 7,
      cancelled: 4,
    },
    paymentReviewCount: 5,
    oldestPaymentReviewAt: '2026-08-01T02:51:54.439Z',
    verifiedOrders: 3,
    verifiedRevenue: 230,
    verifiedRevenueVes: 110000,
    averageTicket: 76.67,
    averageTicketVes: 36666.67,
    exchangeRate: 481.22,
    currentMonth: {
      month: '2026-09',
      verifiedOrders: 2,
      verifiedRevenue: 150,
      verifiedRevenueVes: 72000,
      averageTicket: 75,
      averageTicketVes: 36000,
      percentageChangeRevenue: 87.5,
      percentageChangeOrders: 100,
      percentageChangeAverageTicket: -6.25,
    },
    previousMonth: {
      month: '2026-08',
      verifiedOrders: 1,
      verifiedRevenue: 80,
      verifiedRevenueVes: 38000,
      averageTicket: 80,
      averageTicketVes: 38000,
    },
    ...over,
  });

  /**
   * Acota las comprobaciones a UNA tarjeta. El panel pinta más ceros abajo
   * (productos, stock), así que un `getByText('0')` suelto encontraría varios
   * y, peor, podría dar por buena una tarjeta de ventas vacía leyendo el cero
   * de otro bloque.
   */
  const tarjeta = (titulo: string) => {
    const encabezado = screen.getByText(titulo);
    const caja = encabezado.closest('div.rounded-lg');
    if (!caja) throw new Error(`sin tarjeta para "${titulo}"`);
    return within(caja as HTMLElement);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getProductStats.mockResolvedValue({
      total: 0,
      published: 0,
      unpublished: 0,
      featured: 0,
      lowStock: 0,
    });
    getLowStock.mockResolvedValue([]);
  });

  it('pinta los tres números del mes en vez de "No hay datos disponibles"', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    // Esperar a la tarjeta y no sólo a que desaparezca el aviso: mientras
    // carga tampoco está el aviso, así que un `waitFor` sobre su ausencia se
    // daría por satisfecho antes de que llegara ningún dato.
    await screen.findByText('Ingresos verificados del Mes');
    expect(
      screen.queryByText('No hay datos disponibles'),
    ).not.toBeInTheDocument();

    const ingresos = tarjeta('Ingresos verificados del Mes');
    expect(ingresos.getByText('Bs. 72.000,00')).toBeInTheDocument();
    expect(ingresos.getByText('$150.00')).toBeInTheDocument();

    const pedidos = tarjeta('Pedidos pagados del Mes');
    expect(pedidos.getByText('2')).toBeInTheDocument();

    const promedio = tarjeta('Promedio por Pedido');
    expect(promedio.getByText('Bs. 36.000,00')).toBeInTheDocument();
    expect(promedio.getByText('$75.00')).toBeInTheDocument();
  });

  it('dice de qué mes habla, en la zona horaria de la tienda', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    // "2026-09" leído como fecha UTC caería en agosto en Venezuela; la
    // cabecera tiene que decir septiembre, igual que las tarjetas de abajo.
    expect(await screen.findByText('septiembre 2026')).toBeInTheDocument();
  });

  it('muestra las variaciones que manda el backend, no un 0% inventado', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    await screen.findByText('Ingresos verificados del Mes');

    expect(tarjeta('Ingresos verificados del Mes').getByText('87.5%')).toBeInTheDocument();
    expect(tarjeta('Pedidos pagados del Mes').getByText('100.0%')).toBeInTheDocument();
    // -6.25 se pinta como una bajada del 6.3%, con su flecha hacia abajo.
    expect(tarjeta('Promedio por Pedido').getByText('6.3%')).toBeInTheDocument();
  });

  it('avisa de que no hay comparación en vez de pintar 0% contra la nada', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-09',
          verifiedOrders: 2,
          verifiedRevenue: 150,
          verifiedRevenueVes: 72000,
          averageTicket: 75,
          averageTicketVes: 36000,
          percentageChangeRevenue: null,
          percentageChangeOrders: null,
          percentageChangeAverageTicket: null,
        },
        previousMonth: {
          month: '2026-08',
          verifiedOrders: 0,
          verifiedRevenue: 0,
          verifiedRevenueVes: null,
          averageTicket: 0,
          averageTicketVes: null,
        },
      }),
    );

    render(<AdminDashboard />);

    const avisos = await screen.findAllByText(
      'Sin comparación: no hubo ventas el mes anterior',
    );
    expect(avisos).toHaveLength(3);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('un mes sin ventas verificadas se pinta en cero, no como bloque vacío', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-09',
          verifiedOrders: 0,
          verifiedRevenue: 0,
          verifiedRevenueVes: null,
          averageTicket: 0,
          averageTicketVes: null,
          percentageChangeRevenue: -100,
          percentageChangeOrders: -100,
          percentageChangeAverageTicket: -100,
        },
      }),
    );

    render(<AdminDashboard />);

    // Esperar a la tarjeta y no sólo a que desaparezca el aviso: mientras
    // carga tampoco está el aviso, así que un `waitFor` sobre su ausencia se
    // daría por satisfecho antes de que llegara ningún dato.
    await screen.findByText('Ingresos verificados del Mes');
    expect(
      screen.queryByText('No hay datos disponibles'),
    ).not.toBeInTheDocument();
    expect(tarjeta('Pedidos pagados del Mes').getByText('0')).toBeInTheDocument();
    expect(tarjeta('Ingresos verificados del Mes').getByText('$0.00')).toBeInTheDocument();
    expect(tarjeta('Ingresos verificados del Mes').getByText('Bs. 0,00')).toBeInTheDocument();
  });

  it('deja claro que sólo cuenta lo cobrado y verificado', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    expect(
      await screen.findByText(/pago verificado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no se cuentan los cancelados/i)).toBeInTheDocument();
  });
});
