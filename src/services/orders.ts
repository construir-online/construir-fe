import { apiClient } from '@/lib/api';
import { aNumero, aNumeroONulo, avisarSiDiverge } from '@/lib/api-normalizacion';
import type {
  AdminOrderRow,
  AdminOrderStats,
  Order,
  OrderItem,
  OrderSummary,
  TrackedOrder,
  TrackedOrderItem,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from '@/types';

/**
 * Los montos de un pedido llegan como TEXTO, no como número.
 *
 * `subtotal`, `tax`, `shipping`, `total`, sus equivalentes en Bs. y la tasa son
 * columnas `numeric` de Postgres, y TypeORM las serializa como cadena
 * (`"37.12"`), aunque `Order` las declare `number`. Casi todo el detalle del
 * pedido sobrevivía por casualidad —`formatCurrency` hace `parseFloat`, y los
 * guardas `order.tax > 0` coaccionan— pero eso no es un contrato: `"0.00"` es
 * una cadena TRUTHY, así que la fila de descuento sólo se salvaba de aparecer
 * en todos los pedidos gracias al `> 0` que alguien puso al lado.
 *
 * Se normaliza acá, en el borde, para que las vistas reciban el `number` que se
 * les prometió. Ver `lib/api-normalizacion.ts` para el razonamiento completo.
 */
function normalizarRenglon(crudo: OrderItem): OrderItem {
  return {
    ...crudo,
    quantity: aNumero(crudo.quantity),
    subtotal: aNumero(crudo.subtotal),
    subtotalVes: aNumeroONulo(crudo.subtotalVes),
  };
}

/**
 * Normaliza un pedido completo (`/orders` y `/orders/:uuid`).
 *
 * `totalItems` merece explicación aparte: es un getter calculado de la entidad
 * del backend y NO viaja en la respuesta, porque a los getters del prototipo
 * hay que ponerles `@Expose()` para que `ClassSerializerInterceptor` los
 * incluya —justo lo que ya se arregló en su día para el carrito y quedó
 * pendiente en el pedido—. Sin él, "Mis pedidos" le mostraba al cliente
 * **"undefined productos"** debajo de cada compra.
 *
 * Se arregla en el backend, pero acá se deriva igualmente de los renglones, que
 * sí viajan: así la pantalla deja de mentir sin esperar a un despliegue, y el
 * día que el campo llegue se usa el del servidor.
 */
function normalizarPedido(crudo: Order): Order {
  avisarSiDiverge('GET /orders', crudo, {
    total: 'number',
    subtotal: 'number',
    tax: 'number',
    totalItems: 'number',
  });

  const items = (crudo.items ?? []).map(normalizarRenglon);

  return {
    ...crudo,
    items,
    subtotal: aNumero(crudo.subtotal),
    subtotalVes: aNumeroONulo(crudo.subtotalVes),
    tax: aNumero(crudo.tax),
    taxVes: aNumeroONulo(crudo.taxVes),
    shipping: aNumero(crudo.shipping),
    shippingVes: aNumeroONulo(crudo.shippingVes),
    discountAmount: aNumero(crudo.discountAmount),
    discountAmountVes: aNumeroONulo(crudo.discountAmountVes),
    total: aNumero(crudo.total),
    totalVes: aNumeroONulo(crudo.totalVes),
    exchangeRate: aNumeroONulo(crudo.exchangeRate),
    totalItems:
      crudo.totalItems ?? items.reduce((suma, item) => suma + item.quantity, 0),
  };
}

/** El listado de "Mis pedidos" usa la misma respuesta, recortada al resumen. */
function normalizarResumen(crudo: Order): OrderSummary {
  const pedido = normalizarPedido(crudo);
  return {
    uuid: pedido.uuid,
    orderNumber: pedido.orderNumber,
    status: pedido.status,
    total: pedido.total,
    totalVes: pedido.totalVes,
    totalItems: pedido.totalItems,
    createdAt: pedido.createdAt,
  };
}

/**
 * Normaliza el seguimiento público, que tiene su propio contrato recortado.
 *
 * Aquí TODOS los montos son anulables, incluido `total`: el DTO del backend los
 * emite con `money()`, que conserva el nulo. Por eso se usa `aNumeroONulo` y no
 * `aNumero` — convertir un `null` en `0` le diría al cliente que su pedido
 * costó cero.
 */
function normalizarSeguimiento(crudo: TrackedOrder): TrackedOrder {
  return {
    ...crudo,
    subtotal: aNumeroONulo(crudo.subtotal),
    subtotalVes: aNumeroONulo(crudo.subtotalVes),
    tax: aNumeroONulo(crudo.tax),
    taxVes: aNumeroONulo(crudo.taxVes),
    shipping: aNumeroONulo(crudo.shipping),
    discountAmount: aNumeroONulo(crudo.discountAmount),
    discountAmountVes: aNumeroONulo(crudo.discountAmountVes),
    total: aNumeroONulo(crudo.total),
    totalVes: aNumeroONulo(crudo.totalVes),
    exchangeRate: aNumeroONulo(crudo.exchangeRate),
    items: (crudo.items ?? []).map(
      (item): TrackedOrderItem => ({
        ...item,
        quantity: aNumero(item.quantity),
        price: aNumeroONulo(item.price),
        priceVes: aNumeroONulo(item.priceVes),
        subtotal: aNumeroONulo(item.subtotal),
        subtotalVes: aNumeroONulo(item.subtotalVes),
      }),
    ),
  };
}

/**
 * Servicio para gestión de órdenes
 */
export const ordersService = {
  /**
   * Crea una nueva orden desde el carrito del usuario
   */
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return normalizarPedido(await apiClient.post<Order>('/orders', data));
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
    return normalizarPedido(
      await apiClient.post<Order>(`/orders/${orderUuid}/receipt`, formData),
    );
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
    const crudo = await apiClient.get<Order[]>('/orders');
    return crudo.map(normalizarResumen);
  },

  /**
   * Obtiene los detalles de una orden específica
   */
  async getOrderByUuid(uuid: string): Promise<Order> {
    return normalizarPedido(await apiClient.get<Order>(`/orders/${uuid}`));
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

    return normalizarSeguimiento(await response.json());
  },

  /**
   * Actualiza el estado de una orden (Solo Admin)
   */
  async updateOrderStatus(
    uuid: string,
    data: UpdateOrderStatusDto
  ): Promise<Order> {
    return normalizarPedido(
      await apiClient.patch<Order>(`/orders/${uuid}/status`, data),
    );
  },

  /**
   * Cancela una orden y restaura el inventario
   */
  async cancelOrder(uuid: string): Promise<Order> {
    return normalizarPedido(await apiClient.delete<Order>(`/orders/${uuid}`));
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
