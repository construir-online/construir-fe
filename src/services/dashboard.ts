import { apiClient } from '@/lib/api';
import type { AdminOrderStats } from '@/types';

/**
 * Es la MISMA respuesta que `ordersService.getAdminStats()`, porque es la
 * misma URL.
 *
 * Antes se declaraba aquí un tipo aparte, con campos que el backend nunca
 * envió (`currentMonth.total`, `.count`, `.percentageChangeVes`). Como
 * `apiClient.get` no valida nada, el panel se creía el tipo, la comprobación
 * `dashboardStats.currentMonth && dashboardStats.previousMonth` no se cumplía
 * jamás y el bloque "Ventas e Ingresos del Mes" decía siempre "No hay datos
 * disponibles". Con el alias al tipo compartido, un cambio de contrato rompe
 * la compilación en vez de vaciar una tarjeta en silencio.
 */
export type DashboardStats = AdminOrderStats;

export type {
  MonthlySalesStats,
  CurrentMonthSalesStats,
  PreviousMonthToDateStats,
} from '@/types';

/**
 * Dashboard service for admin metrics and statistics
 */
export const dashboardService = {
  /**
   * Get dashboard statistics for admin panel
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/orders/admin/stats');
  },
};
