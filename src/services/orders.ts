import { apiClient } from '@/lib/api';
import type {
  AdminOrderRow,
  AdminOrderStats,
  Order,
  OrderSummary,
  TrackedOrder,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from '@/types';

/**
 * Servicio para gestión de órdenes
 */
export const ordersService = {
  /**
   * Crea una nueva orden desde el carrito del usuario
   */
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  },

  /**
   * Sube el comprobante de pago para una orden
   */
  async uploadReceipt(orderUuid: string, receipt: File): Promise<Order> {
    const formData = new FormData();
    formData.append('receipt', receipt);

    // Pasa por `apiClient` como todo lo demás: este `fetch` suelto se armaba
    // el `Authorization` leyendo el token de `localStorage`, y sin token ahí
    // la subida del comprobante se quedaba sin sesión.
    return apiClient.post<Order>(`/orders/${orderUuid}/receipt`, formData);
  },

  /**
   * Pide un enlace temporal para ver o descargar el comprobante de una orden.
   *
   * Antes la URL del comprobante venía dentro de la propia orden y apuntaba
   * directo al bucket, que responde a cualquiera. Ahora hay que pedirla, el
   * backend comprueba quién pregunta -admin, order_admin o el cliente dueño de
   * la orden- y lo que devuelve caduca a los pocos minutos, así que no se
   * cachea ni se guarda: se pide cada vez que hace falta.
   */
  async getReceiptUrl(
    orderUuid: string,
    options: { download?: boolean } = {},
  ): Promise<{ url: string; expiresIn: number }> {
    const query = options.download ? '?download=1' : '';
    return apiClient.get<{ url: string; expiresIn: number }>(
      `/orders/${orderUuid}/receipt${query}`,
    );
  },

  /**
   * Obtiene todas las órdenes del usuario autenticado
   */
  async getMyOrders(): Promise<OrderSummary[]> {
    return apiClient.get<OrderSummary[]>('/orders');
  },

  /**
   * Obtiene los detalles de una orden específica
   */
  async getOrderByUuid(uuid: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${uuid}`);
  },

  /**
   * Rastrea una orden por su número (público, sin autenticación).
   *
   * Devuelve un `TrackedOrder`, no un `Order`: al no haber sesión, el backend
   * recorta los datos del pago, la dirección y el perfil del cliente.
   */
  async trackOrder(orderNumber: string): Promise<TrackedOrder> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/orders/track/${orderNumber}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Order not found');
    }

    return response.json();
  },

  /**
   * Actualiza el estado de una orden (Solo Admin)
   */
  async updateOrderStatus(
    uuid: string,
    data: UpdateOrderStatusDto
  ): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${uuid}/status`, data);
  },

  /**
   * Cancela una orden y restaura el inventario
   */
  async cancelOrder(uuid: string): Promise<Order> {
    return apiClient.delete<Order>(`/orders/${uuid}`);
  },

  // ============================================
  // Admin Endpoints
  // ============================================

  /**
   * Obtiene estadísticas del dashboard (Solo Admin)
   */
  async getAdminStats(): Promise<AdminOrderStats> {
    return apiClient.get('/orders/admin/stats');
  },

  /**
   * Filtra órdenes con múltiples opciones (Solo Admin)
   */
  async filterOrders(filters: {
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: AdminOrderRow[]; total: number }> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    return apiClient.get(`/orders/admin/filter?${params.toString()}`);
  },

  /**
   * Exporta órdenes a CSV (Solo Admin)
   */
  async exportToCSV(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    return apiClient.getBlob(`/orders/admin/export/csv?${params.toString()}`);
  },
};
