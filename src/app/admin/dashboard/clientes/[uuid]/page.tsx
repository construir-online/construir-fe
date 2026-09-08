'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customersService } from '@/services/customers';
import type { CustomerDetailResponseDto } from '@/types';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import { formatUSD, formatVES } from '@/lib/currency';
import Link from 'next/link';
import PhoneLink from "@/components/common/PhoneLink";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerUuid = params.uuid as string;

  const [data, setData] = useState<CustomerDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetail();
  }, [customerUuid]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      const customerData = await customersService.getCustomerDetail(customerUuid);
      setData(customerData);
    } catch (error) {
      console.error('Error loading customer detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando información del cliente...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-500 mb-4">No se encontró el cliente</div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          Volver
        </button>
      </div>
    );
  }

  const { customer, stats, recentOrders, addresses = [] } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a clientes
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  customer.type === 'registered'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {customer.type === 'registered' ? 'Usuario Registrado' : 'Cliente Invitado'}
              </span>
              <span className="text-sm text-gray-500">
                Registro: {new Date(customer.createdAt).toLocaleDateString('es-VE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <div className="text-gray-900">{customer.email}</div>
        </div>

        {customer.phone && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Teléfono</span>
            </div>
            <PhoneLink
              phone={customer.phone}
              className="block text-gray-900 hover:text-success-700 hover:underline"
            />
          </div>
        )}

        {customer.identification && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Identificación</span>
            </div>
            <div className="text-gray-900">{customer.identification}</div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Órdenes</h3>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Gastado</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatVES(stats.totalSpentVES)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formatUSD(stats.totalSpentUSD)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Promedio por Orden</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatUSD(stats.averageOrderValue)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Última Compra</h3>
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-lg font-medium text-gray-900">
            {stats.lastOrderDate
              ? new Date(stats.lastOrderDate).toLocaleDateString('es-VE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Órdenes Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Número de Orden
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay órdenes
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.date).toLocaleString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatUSD(order.total)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'processing' || order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/dashboard/ordenes/${order.uuid}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addresses */}
      {addresses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Direcciones de Envío
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{address.address}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {address.city}, {address.state}
                      </div>
                      <div className="text-sm text-gray-600">{address.postalCode}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {address.usedInOrders} {address.usedInOrders === 1 ? 'orden' : 'órdenes'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
