import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../page';
import type { AdminOrderStats, ProductStats, User } from '@/types';
import { UserRole } from '@/types';
import { authService } from '@/services/auth';
import { productsService } from '@/services/products';
import { dashboardService } from '@/services/dashboard';

vi.mock('@/services/auth', () => ({ authService: { getProfile: vi.fn() } }));
vi.mock('@/services/products', () => ({
  productsService: { getStats: vi.fn(), getLowStock: vi.fn() },
}));
vi.mock('@/services/dashboard', () => ({
  dashboardService: { getDashboardStats: vi.fn() },
}));

/**
 * Dos regresiones distintas, las dos introducidas al arreglar la anterior.
 *
 * 1. El panel leía el rol de `localStorage['user']`, que ya nadie escribe. El
 *    gestor de pedidos caía en la rama de administrador, pedía estadísticas de
 *    productos y recibía 403; como las tres llamadas iban en un `Promise.all`,
 *    ese rechazo se llevaba por delante las de pedidos que sí habían llegado
 *    con 200, y el `catch` lo ocultaba. Veía el panel vacío.
 *
 * 2. Al pasar a `Promise.allSettled` se arregló el efecto dominó, pero un
 *    bloque que no cargaba pasó a pintarse en CERO: "Total Productos 0" a una
 *    ferretería con 1267 productos, y "Bajo Stock 0" justo encima de una tabla
 *    con productos de bajo stock. El panel en blanco de antes era feo pero
 *    honesto; un cero se lee como un dato y nadie puede saber que es un fallo.
 *
 * Estas pruebas fijan que un bloque caído se DIGA, y que uno caído no arrastre
 * a los demás.
 */
describe('Dashboard del panel — bloques que fallan por separado', () => {
  const ESTADISTICAS: ProductStats = {
    total: 1267, published: 1200, unpublished: 67, featured: 5, lowStock: 32,
  };

  /**
   * Un usuario completo, no `{ role } as never`. El `as never` de antes
   * silenciaba al compilador: era lo que dejaba pasar dobles a los que les
   * faltaba media respuesta.
   */
  const usuario = (role: UserRole): User => ({
    uuid: 'admin-uuid',
    firstName: 'Admin',
    lastName: 'Principal',
    email: 'admin@construir.com',
    role,
    isActive: true,
    deletedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  // La forma REAL de `GET /orders/admin/stats`. Antes este doble llevaba
  // campos inventados (`total`, `count`) que el backend nunca envió: las
  // pruebas pasaban igual porque sólo miraban el título de la tarjeta, y el
  // bloque llevaba meses pintando "No hay datos disponibles" en producción.
  const VENTAS: AdminOrderStats = {
    totalOrders: 17,
    todayOrders: 0,
    monthOrders: 4,
    ordersByStatus: { 'on-hold': 4, pending: 0, completed: 8, cancelled: 5 },
    paymentReviewCount: 0,
    oldestPaymentReviewAt: null,
    verifiedOrders: 7,
    verifiedRevenue: 190,
    verifiedRevenueVes: 7600,
    averageTicket: 27.14,
    averageTicketVes: 1085.71,
    exchangeRate: 481.22,
    currentMonth: {
      month: '2026-09',
      daysElapsed: 9,
      verifiedOrders: 4,
      verifiedRevenue: 100,
      verifiedRevenueVes: 4000,
      averageTicket: 25,
      averageTicketVes: 1000,
      percentageChangeRevenue: 11.11,
      percentageChangeOrders: 33.33,
      percentageChangeAverageTicket: -16.67,
    },
    previousMonth: {
      month: '2026-08',
      verifiedOrders: 3,
      verifiedRevenue: 90,
      verifiedRevenueVes: 3600,
      averageTicket: 30,
      averageTicketVes: 1200,
    },
    previousMonthToDate: {
      month: '2026-08',
      verifiedOrders: 3,
      verifiedRevenue: 90,
      verifiedRevenueVes: 3600,
      averageTicket: 30,
      averageTicketVes: 1200,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsService.getLowStock).mockResolvedValue([]);
  });

  const comoAdmin = () =>
    vi.mocked(authService.getProfile).mockResolvedValue(usuario(UserRole.ADMIN));

  it('un 500 en las estadísticas de productos se DICE, no se pinta como 0', async () => {
    // El caso reproducido: `stats?.total || 0` mostraba "0" con toda la
    // credibilidad de un dato real.
    comoAdmin();
    vi.mocked(productsService.getStats).mockRejectedValue(
      Object.assign(new Error('Internal server error'), { statusCode: 500 }),
    );
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue(VENTAS);

    render(<AdminDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/No se pudieron cargar las estadísticas de productos/i))
        .toBeInTheDocument(),
    );
    // Y sobre todo: que no haya quedado ningún cero haciéndose pasar por dato.
    expect(screen.queryByText('Total Productos')).not.toBeInTheDocument();
  });

  it('un bloque caído no arrastra a los que sí cargaron', async () => {
    // Lo que arregló `allSettled` y no se puede perder al añadir los errores.
    comoAdmin();
    vi.mocked(productsService.getStats).mockRejectedValue(new Error('500'));
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue(VENTAS);

    render(<AdminDashboard />);

    await waitFor(() => expect(screen.getByText('Pedidos pagados')).toBeInTheDocument());
    expect(screen.getByText(/No se pudieron cargar las estadísticas de productos/i))
      .toBeInTheDocument();
  });

  it('"no hubo ventas" y "no pude preguntar" no se ven igual', async () => {
    // Antes las dos situaciones pintaban "No hay datos disponibles", que para
    // el dueño significa "este mes no vendiste nada".
    comoAdmin();
    vi.mocked(productsService.getStats).mockResolvedValue(ESTADISTICAS);
    vi.mocked(dashboardService.getDashboardStats).mockRejectedValue(new Error('500'));

    render(<AdminDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/No se pudieron cargar las métricas de ventas/i))
        .toBeInTheDocument(),
    );
    expect(screen.queryByText('No hay datos disponibles')).not.toBeInTheDocument();
    // El bloque de productos sí cargó y tiene que verse con su número real.
    expect(screen.getByText('1267')).toBeInTheDocument();
  });

  it('cuando todo carga, se pintan los números y ningún aviso', async () => {
    comoAdmin();
    vi.mocked(productsService.getStats).mockResolvedValue(ESTADISTICAS);
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue(VENTAS);

    render(<AdminDashboard />);

    await waitFor(() => expect(screen.getByText('1267')).toBeInTheDocument());
    expect(screen.queryByText(/No se pudieron cargar/i)).not.toBeInTheDocument();
  });

  it('el gestor de pedidos NO pide las estadísticas de productos', async () => {
    // La regresión original: sin rol, entraba por la rama de administrador y
    // se comía un 403 que borraba el resto del panel.
    vi.mocked(authService.getProfile).mockResolvedValue(usuario(UserRole.ORDER_ADMIN));
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue(VENTAS);

    render(<AdminDashboard />);

    await waitFor(() => expect(screen.getByText('Pedidos pagados')).toBeInTheDocument());
    expect(productsService.getStats).not.toHaveBeenCalled();
    expect(productsService.getLowStock).not.toHaveBeenCalled();
  });

  it('al gestor de pedidos también se le dice si sus métricas no cargan', async () => {
    vi.mocked(authService.getProfile).mockResolvedValue(usuario(UserRole.ORDER_ADMIN));
    vi.mocked(dashboardService.getDashboardStats).mockRejectedValue(new Error('500'));

    render(<AdminDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/No se pudieron cargar las métricas de ventas/i))
        .toBeInTheDocument(),
    );
  });
});
