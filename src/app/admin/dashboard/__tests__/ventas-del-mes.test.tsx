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
const getProfile = vi.fn();

vi.mock('@/services/auth', () => ({
  authService: {
    getProfile: () => getProfile(),
  },
}));

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
    paymentReviewCount: 17,
    oldestPaymentReviewAt: '2026-08-01T02:51:54.439Z',
    verifiedOrders: 3,
    verifiedRevenue: 230,
    verifiedRevenueVes: 110000,
    averageTicket: 76.67,
    averageTicketVes: 36666.67,
    exchangeRate: 481.22,
    currentMonth: {
      month: '2026-09',
      daysElapsed: 9,
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
      verifiedOrders: 3,
      verifiedRevenue: 430,
      verifiedRevenueVes: 206000,
      averageTicket: 143.33,
      averageTicketVes: 68666.67,
    },
    // El tramo comparable: los mismos 9 días de agosto, que es contra lo que
    // el backend calcula los porcentajes.
    previousMonthToDate: {
      month: '2026-08',
      daysCompared: 9,
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
    getProfile.mockResolvedValue({ role: 'admin' });
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
    await screen.findByText('Ingresos verificados');
    expect(
      screen.queryByText('No hay datos disponibles'),
    ).not.toBeInTheDocument();

    const ingresos = tarjeta('Ingresos verificados');
    expect(ingresos.getByText('Bs. 72.000,00')).toBeInTheDocument();
    expect(ingresos.getByText('$150,00')).toBeInTheDocument();

    const pedidos = tarjeta('Pedidos pagados');
    expect(pedidos.getByText('2')).toBeInTheDocument();

    const promedio = tarjeta('Promedio por Pedido');
    expect(promedio.getByText('Bs. 36.000,00')).toBeInTheDocument();
    expect(promedio.getByText('$75,00')).toBeInTheDocument();
  });

  it('dice de qué mes habla, en la zona horaria de la tienda', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    // "2026-09" leído como fecha UTC caería en agosto en Venezuela; la
    // cabecera tiene que decir septiembre, igual que las tarjetas de abajo.
    // Y "lo que va de", porque el día 9 estas cifras son de nueve días: sin
    // decirlo, el dueño las compara con un mes cerrado.
    expect(
      await screen.findByText('lo que va de septiembre 2026'),
    ).toBeInTheDocument();
    // Y sin "del Mes" en el encabezado: sobra al lado de "lo que va de
    // septiembre" y, peor, contradice que la cifra sea de nueve días.
    expect(screen.queryByText(/Ventas e Ingresos del Mes/)).not.toBeInTheDocument();
    expect(
      screen.getByText('lo que va de septiembre 2026').closest('h2'),
    ).toHaveTextContent('Ventas e Ingresos lo que va de septiembre 2026');
  });

  it('dice contra qué tramo compara, no un "vs mes anterior" a secas', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    await screen.findByText('Ingresos verificados');

    // El backend compara los 9 días de septiembre contra los 9 primeros de
    // agosto (80 USD), no contra el agosto entero (430 USD). El rótulo tiene
    // que decirlo o el porcentaje se lee mal.
    expect(
      tarjeta('Ingresos verificados').getByText(
        'vs los primeros 9 días de agosto, en USD',
      ),
    ).toBeInTheDocument();
    expect(
      tarjeta('Pedidos pagados').getByText('vs los primeros 9 días de agosto'),
    ).toBeInTheDocument();
    expect(screen.queryByText('vs mes anterior')).not.toBeInTheDocument();
  });

  it('rotula los días del TRAMO, no los del mes en curso', async () => {
    // 31 de marzo contra un febrero de 28. Si el rótulo saliera de los días
    // que lleva el mes actual diría "los primeros 31 días de febrero": un
    // periodo que no existe, y encima escondería que la comparación es
    // asimétrica. El backend ya recortó el tramo y manda 28.
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-03',
          daysElapsed: 31,
          verifiedOrders: 2,
          verifiedRevenue: 150,
          verifiedRevenueVes: 72000,
          averageTicket: 75,
          averageTicketVes: 36000,
          percentageChangeRevenue: 87.5,
          percentageChangeOrders: 100,
          percentageChangeAverageTicket: -6.25,
        },
        previousMonthToDate: {
          month: '2026-02',
          daysCompared: 28,
          verifiedOrders: 1,
          verifiedRevenue: 80,
          verifiedRevenueVes: 38000,
          averageTicket: 80,
          averageTicketVes: 38000,
        },
      }),
    );

    render(<AdminDashboard />);

    await screen.findByText('Ingresos verificados');

    expect(
      tarjeta('Pedidos pagados').getByText('vs los primeros 28 días de febrero'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/31 días de febrero/)).not.toBeInTheDocument();
    expect(screen.getByText('lo que va de marzo 2026')).toBeInTheDocument();
  });

  it('enseña los comprobantes por revisar junto a la cifra', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-09',
          daysElapsed: 9,
          verifiedOrders: 0,
          verifiedRevenue: 0,
          verifiedRevenueVes: null,
          averageTicket: 0,
          averageTicketVes: null,
          percentageChangeRevenue: null,
          percentageChangeOrders: null,
          percentageChangeAverageTicket: null,
        },
      }),
    );

    render(<AdminDashboard />);

    // Un cero solo se lee como "no vendiste nada". Con los 17 comprobantes al
    // lado se lee como lo que es: trabajo pendiente del propio admin.
    const enlace = await screen.findByRole('link', {
      name: '17 comprobantes por revisar',
    });
    expect(enlace).toHaveAttribute('href', '/admin/dashboard/ordenes');
    expect(
      screen.getByText(/esos pedidos no suman aquí/i),
    ).toBeInTheDocument();
  });

  it('no habla de comprobantes cuando no queda ninguno por revisar', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({ paymentReviewCount: 0 }),
    );

    render(<AdminDashboard />);

    await screen.findByText('Ingresos verificados');
    expect(screen.queryByText(/comprobantes? por revisar/i)).not.toBeInTheDocument();
  });

  it('muestra las variaciones que manda el backend, no un 0% inventado', async () => {
    getDashboardStats.mockResolvedValue(respuestaDelBackend());

    render(<AdminDashboard />);

    await screen.findByText('Ingresos verificados');

    expect(tarjeta('Ingresos verificados').getByText('87.5%')).toBeInTheDocument();
    expect(tarjeta('Pedidos pagados').getByText('100.0%')).toBeInTheDocument();
    // -6.25 se pinta como una bajada del 6.3%, con su flecha hacia abajo.
    expect(tarjeta('Promedio por Pedido').getByText('6.3%')).toBeInTheDocument();
  });

  it('avisa de que no hay comparación en vez de pintar 0% contra la nada', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-09',
          daysElapsed: 9,
          verifiedOrders: 2,
          verifiedRevenue: 150,
          verifiedRevenueVes: 72000,
          averageTicket: 75,
          averageTicketVes: 36000,
          percentageChangeRevenue: null,
          percentageChangeOrders: null,
          percentageChangeAverageTicket: null,
        },
        previousMonthToDate: {
          month: '2026-08',
          daysCompared: 9,
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
      'Sin comparación: no hubo ingresos verificados el mes anterior',
    );
    expect(avisos).toHaveLength(3);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('un mes sin ventas verificadas se pinta en cero, no como bloque vacío', async () => {
    getDashboardStats.mockResolvedValue(
      respuestaDelBackend({
        currentMonth: {
          month: '2026-09',
          daysElapsed: 9,
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
    await screen.findByText('Ingresos verificados');
    expect(
      screen.queryByText('No hay datos disponibles'),
    ).not.toBeInTheDocument();
    expect(tarjeta('Pedidos pagados').getByText('0')).toBeInTheDocument();
    expect(tarjeta('Ingresos verificados').getByText('$0,00')).toBeInTheDocument();
    expect(tarjeta('Ingresos verificados').getByText('Bs. 0,00')).toBeInTheDocument();
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
