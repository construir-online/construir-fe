"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, PackageSearch } from "lucide-react";
import { ordersService } from "@/services/orders";
import { OrderDetail } from "@/components/orders/OrderDetail";
import type { TrackedOrder } from "@/types";
import WhatsAppPedidoBoton from "@/components/orders/WhatsAppPedidoBoton";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const t = useTranslations("tracking");

  const [order, setOrder] = useState<TrackedOrder | null>(null);
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
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center px-4 text-center">
        <PackageSearch className="w-16 h-16 text-sand-500 mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-2">
          {t("notFound")}
        </h1>
        <p className="text-sand-600 mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className="flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        >
          {t("backToHome")}
        </Link>
        {/* Si el número no aparece, escribir a la tienda es la única salida
            útil que le queda al cliente. */}
        <WhatsAppPedidoBoton className="mt-3">
          {t("writeOnWhatsApp")}
        </WhatsAppPedidoBoton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-sand-600">{t("title")}</h1>
        </div>
        {/* Sin datos de pago: esta pantalla se abre con sólo el número de
            pedido, y el backend ya no los envía. */}
        <OrderDetail order={order} showPaymentDetails={false} />

        {/* La entrega se coordina por WhatsApp con un vendedor: es la acción
            que de verdad sigue después de mirar el avance. */}
        <div className="mt-6">
          <WhatsAppPedidoBoton orderNumber={order.orderNumber} variante="primario" className="w-full sm:w-auto">
            {t("writeOnWhatsApp")}
          </WhatsAppPedidoBoton>
        </div>
      </div>
    </div>
  );
}
