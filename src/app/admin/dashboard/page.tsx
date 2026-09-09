'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/services/products';
import { authService } from '@/services/auth';
import { dashboardService, type DashboardStats } from '@/services/dashboard';
import type { ProductStats, Product, User } from '@/types';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { formatUSD, formatVES } from '@/lib/currency';
import { formatComparisonLabel, formatMonthLabel } from '@/lib/month-label';
import Link from 'next/link';

/**
 * Lo que se pinta cuando un bloque no pudo cargar.
 *
 * Tiene que decir explícitamente que NO se pudieron cargar los datos. Un cero
 * en su lugar es peor que la pantalla en blanco que había antes: el blanco al
 * menos se ve roto, mientras que "Total Productos 0" se lee como un dato.
 */
function AvisoBloqueCaido({
  nombre,
  onReintentar,
}: {
  nombre: string;
  onReintentar: () => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-amber-800">
            No se pudieron cargar {nombre}
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Los datos de esta sección no están disponibles ahora mismo. Lo que
            ves en el resto del panel sí es correcto.
          </p>
          <button
            type="button"
            onClick={onReintentar}
            className="mt-2 text-sm font-medium text-amber-800 underline hover:text-amber-900"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // Un bloque que no pudo cargar NO es un bloque en cero. Sin esta distinción,
  // un 500 en `/products/admin/stats` pintaba "Total Productos 0" a una
  // ferretería con 1267 productos, y "Bajo Stock 0" justo encima de una tabla
  // con cinco productos de bajo stock: la pantalla se contradecía a sí misma y
  // el dato falso era perfectamente creíble.
  const [errorProductos, setErrorProductos] = useState(false);
  const [errorVentas, setErrorVentas] = useState(false);

  useEffect(() => {
    // El rol tiene que venir del servidor. Mientras se leyó de
    // `localStorage['user']`, que ya nadie escribe, `currentUser` era SIEMPRE
    // `null` y el gestor de pedidos caía en la rama de administrador: pedía las
    // estadísticas de productos, recibía 403, y como iban en un `Promise.all`
    // el rechazo se llevaba por delante también las de pedidos, que sí habían
    // llegado con 200. Veía el panel vacío.
    let vigente = true;

    authService
      .getProfile()
      .then((perfil) => {
        if (!vigente) return;
        setUser(perfil);
        return loadData(perfil.role);
      })
      .catch((error) => {
        console.error('Error cargando el perfil del panel:', error);
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const loadData = async (role: User['role']) => {
    try {
      setLoading(true);

      if (role === 'order_admin') {
        // ORDER_ADMIN only sees order stats (no product stats or low stock)
        try {
          setDashboardStats(await dashboardService.getDashboardStats());
          setErrorVentas(false);
        } catch (error) {
          console.error('Error cargando las métricas de ventas:', error);
          setErrorVentas(true);
        }
        return;
      }

      // `allSettled` y no `all`: con `all`, un solo 403 —o un endpoint caído—
      // dejaba el panel entero en blanco y escondía los bloques que sí habían
      // respondido. Cada bloque se pinta si su llamada llegó.
      const [statsData, lowStock, dashStats] = await Promise.allSettled([
        productsService.getStats(),
        productsService.getLowStock(10),
        dashboardService.getDashboardStats(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (lowStock.status === 'fulfilled') setLowStockProducts(lowStock.value);
      if (dashStats.status === 'fulfilled') setDashboardStats(dashStats.value);

      // Cada bloque recuerda si SU llamada falló, para poder decirlo en
      // pantalla en vez de enseñar ceros que parecen datos.
      setErrorProductos(statsData.status === 'rejected');
      setErrorVentas(dashStats.status === 'rejected');

      for (const r of [statsData, lowStock, dashStats]) {
        if (r.status === 'rejected') console.error('Error cargando un bloque del panel:', r.reason);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recargar = () => {
    if (user) loadData(user.role);
  };

  const isOrderAdmin = user?.role === 'order_admin';

  // Contra qué tramo se comparan las tarjetas. El porcentaje se calcula en el
  // backend contra los mismos días del mes anterior, y el rótulo tiene que
  // decirlo: "vs mes anterior" a secas invitaba a leer nueve días contra un
  // mes cerrado.
  const tramoComparado = dashboardStats?.currentMonth
    ? formatComparisonLabel(
        dashboardStats.currentMonth.daysElapsed,
        dashboardStats.previousMonth.month,
      )
    : 'vs mes anterior';

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Métricas de Ventas e Ingresos */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Ventas e Ingresos del Mes
          {dashboardStats?.currentMonth && (
            /* "lo que va de" y no sólo el mes: el día 9 estas cifras son de
               nueve días, y sin decirlo el dueño las compara mentalmente con
               un mes cerrado. */
            <span className="ml-2 text-base font-normal text-gray-500">
              lo que va de {formatMonthLabel(dashboardStats.currentMonth.month)}
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Sólo pedidos con el pago verificado; no se cuentan los cancelados ni
          los que están a la espera de revisar el comprobante.
        </p>
        {loading ? (
          <div className="text-gray-500">Cargando métricas...</div>
        ) : errorVentas ? (
          <AvisoBloqueCaido nombre="las métricas de ventas" onReintentar={recargar} />
        ) : dashboardStats?.currentMonth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Ingresos verificados"
              value={formatVES(dashboardStats.currentMonth.verifiedRevenueVes ?? 0)}
              secondaryValue={formatUSD(dashboardStats.currentMonth.verifiedRevenue)}
              percentageChange={dashboardStats.currentMonth.percentageChangeRevenue}
              comparisonLabel={`${tramoComparado}, en USD`}
              icon={DollarSign}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
            />
            <MetricCard
              title="Pedidos pagados"
              value={dashboardStats.currentMonth.verifiedOrders.toString()}
              percentageChange={dashboardStats.currentMonth.percentageChangeOrders}
              comparisonLabel={tramoComparado}
              icon={ShoppingCart}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
            />
            <MetricCard
              title="Promedio por Pedido"
              value={formatVES(dashboardStats.currentMonth.averageTicketVes ?? 0)}
              secondaryValue={formatUSD(dashboardStats.currentMonth.averageTicket)}
              percentageChange={dashboardStats.currentMonth.percentageChangeAverageTicket}
              comparisonLabel={`${tramoComparado}, en USD`}
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
            />
          </div>
        ) : (
          <div className="text-gray-500">No hay datos disponibles</div>
        )}

        {/* El cero de arriba casi nunca significa "no vendiste": significa que
            nadie ha revisado los comprobantes. Sin este renglón, el dueño ve
            una cifra en cero junto a una explicación abstracta y no sabe que
            la pelota está en su tejado. */}
        {!errorVentas && dashboardStats && dashboardStats.paymentReviewCount > 0 && (
          <p className="mt-4 text-sm text-gray-600">
            Hay{' '}
            <Link
              href="/admin/dashboard/ordenes"
              className="font-medium text-blue-600 hover:text-blue-800 underline"
            >
              {dashboardStats.paymentReviewCount}{' '}
              {dashboardStats.paymentReviewCount === 1
                ? 'comprobante por revisar'
                : 'comprobantes por revisar'}
            </Link>
            . Hasta que se verifiquen, esos pedidos no suman aquí.
          </p>
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
            ) : errorProductos ? (
              <AvisoBloqueCaido nombre="las estadísticas de productos" onReintentar={recargar} />
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
