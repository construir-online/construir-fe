import type { OrderStatus, PaymentStatus } from '@/types';

/**
 * Obtiene la clave de traducción para el estado de la orden
 */
export function getOrderStatusKey(status: OrderStatus): string {
  return `order.status.${status}`;
}

/**
 * Obtiene la clave de traducción para el estado del pago
 */
export function getPaymentStatusKey(status: PaymentStatus): string {
  return `payment.status.${status}`;
}

/**
 * Obtiene el color del badge según el estado de la orden
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    payment_review: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el color del badge según el estado del pago
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colorMap: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}
