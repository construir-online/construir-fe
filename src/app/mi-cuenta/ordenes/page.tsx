"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBag, ChevronRight, AlertCircle, Package } from "lucide-react";
import { ordersService } from "@/services/orders";
import { getOrderStatusColor, getOrderProgress } from "@/lib/order-helpers";
import { formatUSD, formatVES } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";
import type { OrderSummary } from "@/types";

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-sand-300 bg-white p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 bg-sand-200 rounded w-32" />
        <div className="h-5 bg-sand-200 rounded-full w-20" />
      </div>
      <div className="h-3 bg-sand-100 rounded w-40 mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-sand-200">
        <div className="h-5 bg-sand-200 rounded w-20" />
        <div className="h-4 bg-sand-100 rounded w-24" />
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

  const itemLabel = order.totalItems === 1 ? "1 producto" : `${order.totalItems} productos`;
  const progress = getOrderProgress(order.status);
  const isClosed = progress === null || progress === 1;

  return (
    <Link
      href={`/mi-cuenta/ordenes/${order.uuid}`}
      className={`group flex flex-col gap-2.5 rounded-2xl border border-sand-300 bg-white p-4 transition-colors hover:border-brand-300 ${
        isClosed ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[14.5px] font-bold text-ink">
          {order.orderNumber}
        </span>
        <span
          className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${getOrderStatusColor(order.status)}`}
        >
          {t(`statuses.${order.status}`)}
        </span>
      </div>

      <p className="text-[12px] font-medium text-sand-600">
        {date} · {itemLabel}
      </p>

      {/* Avance sólo mientras el pedido sigue en curso */}
      {progress !== null && progress < 1 && (
        <div className="h-[5px] overflow-hidden rounded-full bg-sand-200">
          <span
            className="block h-full rounded-full bg-accent-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <div className="flex items-end justify-between gap-3 border-t border-sand-200 pt-2.5">
        {/* El importe va dual, con el Bs. de protagonista: es lo que el cliente
            pagó. Los pedidos viejos sin equivalente guardado se quedan en USD. */}
        <span className="flex flex-col leading-tight">
          <span className="text-[16px] font-extrabold text-ink">
            {order.totalVes != null ? formatVES(order.totalVes) : formatUSD(order.total)}
          </span>
          {order.totalVes != null && (
            <span className="text-[12px] font-semibold text-sand-600">
              {formatUSD(order.total)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 rounded-xl border-[1.5px] border-ink px-3 py-2 text-[12.5px] font-bold text-ink transition-colors group-hover:bg-ink group-hover:text-white">
          {tAccount("viewDetail")}
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default function MisOrdenesPage() {
  const tAccount = useTranslations("myAccount");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

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
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
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
        <div className="rounded-2xl border border-danger-100 bg-white p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
          <p className="text-sand-700 font-medium mb-1">
            No pudimos cargar tus pedidos
          </p>
          <p className="text-sand-600 text-sm mb-5">
            Verifica tu conexión e intenta de nuevo.
          </p>
          <button
            onClick={load}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-sand-300 bg-white p-12 text-center">
          <ShoppingBag className="w-14 h-14 text-sand-500 mx-auto mb-4" />
          <p className="text-sand-700 font-medium mb-1">
            {tAccount("noOrders")}
          </p>
          <p className="text-sand-600 text-sm mb-6">
            {tAccount("noOrdersDesc")}
          </p>
          <Link
            href="/productos"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
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
