"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, PackageSearch } from "lucide-react";
import { ordersService } from "@/services/orders";
import { OrderDetail } from "@/components/orders/OrderDetail";
import type { Order } from "@/types";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const t = useTranslations("tracking");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await ordersService.trackOrder(orderNumber);
        setOrder(result);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 text-center">
        <PackageSearch className="w-16 h-16 text-gray-300 dark:text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t("notFound")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-500 dark:text-gray-400">{t("title")}</h1>
        </div>
        <OrderDetail order={order} />
      </div>
    </div>
  );
}
