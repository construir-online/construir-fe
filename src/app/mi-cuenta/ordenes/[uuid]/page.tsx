"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ordersService } from "@/services/orders";
import { OrderDetail } from "@/components/orders/OrderDetail";
import type { Order } from "@/types";

export default function MiOrdenDetailPage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const tAccount = useTranslations("myAccount");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await ordersService.getOrderByUuid(uuid);
        setOrder(result);
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <OrderDetail
        order={order}
        backLink={{ href: "/mi-cuenta/ordenes", label: tAccount("backToOrders") }}
      />
    </div>
  );
}
