"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, ShoppingBag } from "lucide-react";
import { ordersService } from "@/services/orders";
import { getOrderStatusColor } from "@/lib/order-helpers";
import type { OrderSummary } from "@/types";

export default function MisOrdenesPage() {
  const t = useTranslations("orders");
  const tAccount = useTranslations("myAccount");

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await ordersService.getMyOrders();
        setOrders(result);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {tAccount("title")}
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
          <ShoppingBag className="w-14 h-14 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{tAccount("noOrders")}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{tAccount("noOrdersDesc")}</p>
          <Link
            href="/productos"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden sm:table">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tAccount("orderNumber")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tAccount("date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tAccount("status")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tAccount("total")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tAccount("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {orders.map((order) => (
                <tr key={order.uuid} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                      {t(`statuses.${order.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/mi-cuenta/ordenes/${order.uuid}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {tAccount("viewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-gray-200 dark:divide-slate-700 sm:hidden">
            {orders.map((order) => (
              <li key={order.uuid} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{order.orderNumber}</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                    {t(`statuses.${order.status}`)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("es-VE")}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      ${Number(order.total).toFixed(2)}
                    </p>
                  </div>
                  <Link
                    href={`/mi-cuenta/ordenes/${order.uuid}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {tAccount("viewDetail")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
