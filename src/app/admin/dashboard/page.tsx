'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/services/products';
import { dashboardService, type DashboardStats } from '@/services/dashboard';
import type { ProductStats, Product, User } from '@/types';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { formatUSD, formatVES } from '@/lib/currency';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user from localStorage to check role
      const userData = localStorage.getItem('user');
      const currentUser: User | null = userData ? JSON.parse(userData) : null;

      if (currentUser?.role === 'order_admin') {
        // ORDER_ADMIN only sees order stats (no product stats or low stock)
        const dashStats = await dashboardService.getDashboardStats();
        setDashboardStats(dashStats);
      } else {
        // ADMIN sees everything
        const [statsData, lowStock, dashStats] = await Promise.all([
          productsService.getStats(),
          productsService.getLowStock(10),
          dashboardService.getDashboardStats(),
        ]);
        setStats(statsData);
        setLowStockProducts(lowStock);
        setDashboardStats(dashStats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOrderAdmin = user?.role === 'order_admin';

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Métricas de Ventas e Ingresos */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ventas e Ingresos del Mes</h2>
        {loading ? (
          <div className="text-gray-500">Cargando métricas...</div>
        ) : dashboardStats && dashboardStats.currentMonth && dashboardStats.previousMonth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Ingresos del Mes (VES)"
              value={formatVES(dashboardStats.currentMonth.totalVes || 0)}
              secondaryValue={formatUSD(dashboardStats.currentMonth.total || 0)}
              percentageChange={dashboardStats.currentMonth.percentageChangeVes || 0}
              icon={DollarSign}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
            />
            <MetricCard
              title="Ventas del Mes"
              value={(dashboardStats.currentMonth.count || 0).toString()}
              percentageChange={dashboardStats.currentMonth.percentageChangeCount || 0}
              icon={ShoppingCart}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
            />
            <MetricCard
              title="Promedio por Orden"
              value={formatVES(dashboardStats.averageOrderValueVes || 0)}
              secondaryValue={formatUSD(dashboardStats.averageOrderValue || 0)}
              percentageChange={
                dashboardStats.currentMonth.count && dashboardStats.currentMonth.count > 0
                  ? ((dashboardStats.currentMonth.totalVes / dashboardStats.currentMonth.count -
                      dashboardStats.previousMonth.totalVes / (dashboardStats.previousMonth.count || 1)) /
                      (dashboardStats.previousMonth.totalVes / (dashboardStats.previousMonth.count || 1)) * 100)
                  : 0
              }
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
            />
          </div>
        ) : (
          <div className="text-gray-500">No hay datos disponibles</div>
        )}
      </div>

      {/* Productos y Stock Bajo - SOLO para ADMIN */}
      {!isOrderAdmin && (
        <>
          {/* Estadísticas de Productos */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Productos</h2>
            {loading ? (
              <div className="text-gray-500">Cargando estadísticas...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Productos</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Publicados</h3>
                  <p className="text-3xl font-bold text-green-600">{stats?.published || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">No Publicados</h3>
                  <p className="text-3xl font-bold text-gray-600">{stats?.unpublished || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Destacados</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.featured || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Bajo Stock</h3>
                  <p className="text-3xl font-bold text-red-600">{stats?.lowStock || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Productos con bajo inventario */}
          {lowStockProducts.length > 0 && (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Productos con Bajo Inventario
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Inventario
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <tr key={product.uuid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{product.customName ?? product.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-red-600">
                            {product.inventory} unidades
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/dashboard/productos/${product.uuid}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver producto
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lowStockProducts.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/admin/dashboard/productos"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver todos los productos con bajo stock ({lowStockProducts.length})
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mensaje de Bienvenida para ORDER_ADMIN */}
      {isOrderAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Bienvenido, Gestor de Pedidos
          </h3>
          <p className="text-blue-700">
            Como gestor de pedidos, puedes ver y administrar todos los pedidos desde la sección{' '}
            <Link href="/admin/dashboard/ordenes" className="font-medium underline hover:text-blue-900">
              Órdenes
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
