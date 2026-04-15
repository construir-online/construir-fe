"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingBag, ChevronRight, AlertCircle, Package } from "lucide-react";
import { ordersService } from "@/services/orders";
import { getOrderStatusColor } from "@/lib/order-helpers";
import { formatUSD } from "@/lib/currency";
import type { OrderSummary } from "@/types";

function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-32" />
        <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-40 mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-700">
        <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-20" />
        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-24" />
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const t = useTranslations("orders");
  const tAccount = useTranslations("myAccount");

  const date = new Date(order.createdAt).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemLabel =
    order.totalItems === 1
      ? `1 producto`
      : `${order.totalItems} productos`;

  return (
    <Link
      href={`/mi-cuenta/ordenes/${order.uuid}`}
      className="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {order.orderNumber}
          </span>
        </div>
        <span
          className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}
        >
          {t(`statuses.${order.status}`)}
        </span>
      </div>

      {/* Meta */}
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 ml-6">
        {itemLabel} · {date}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-700">
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">
          {formatUSD(order.total)}
        </span>
        <span className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
          {tAccount("viewDetail")}
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

export default function MisOrdenesPage() {
  const tAccount = useTranslations("myAccount");

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await ordersService.getMyOrders();
      setOrders(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {tAccount("title")}
      </h1>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/30 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
            No pudimos cargar tus pedidos
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
            Verifica tu conexión e intenta de nuevo.
          </p>
          <button
            onClick={load}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-12 text-center">
          <ShoppingBag className="w-14 h-14 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
            {tAccount("noOrders")}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {tAccount("noOrdersDesc")}
          </p>
          <Link
            href="/productos"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.uuid} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
