"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  Link2,
  Loader2,
  MessageSquare,
  Printer,
} from "lucide-react";
import { ordersService } from "@/services/orders";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { CustomerCard } from "@/components/admin/order-detail/CustomerCard";
import { DeliveryCard } from "@/components/admin/order-detail/DeliveryCard";
import { HistoryCard } from "@/components/admin/order-detail/HistoryCard";
import { ManagementCard } from "@/components/admin/order-detail/ManagementCard";
import { OrderItemsCard } from "@/components/admin/order-detail/OrderItemsCard";
import { PaymentCard } from "@/components/admin/order-detail/PaymentCard";
import {
  Pill,
  orderStatusTone,
  paymentStatusTone,
} from "@/components/admin/order-detail/primitives";
import { getOrderCustomer } from "@/components/admin/order-detail/order-customer";
import { toWhatsAppUrl } from "@/lib/whatsapp";

export default function OrderDetailPage() {
  const t = useTranslations("orders");
  const params = useParams();
  const router = useRouter();
  const orderUuid = params.uuid as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Campos editables del panel de gestión
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [adminNotes, setAdminNotes] = useState("");

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersService.getOrderByUuid(orderUuid);
      setOrder(data);
      setOrderStatus(data.status);
      setPaymentStatus(data.paymentInfo.status);
      setAdminNotes(data.paymentInfo.adminNotes || "");
    } catch (error) {
      console.error("Error loading order:", error);
      alert(t("loadError"));
      router.push("/admin/dashboard/ordenes");
    } finally {
      setLoading(false);
    }
  }, [orderUuid, router, t]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleSave = async () => {
    if (!order) return;

    try {
      setSaving(true);
      await ordersService.updateOrderStatus(order.uuid, {
        orderStatus,
        paymentStatus,
        adminNotes: adminNotes || undefined,
      });
      await loadOrder();
      alert(t("updateSuccess"));
    } catch (error) {
      console.error("Error updating order:", error);
      alert(t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm(t("cancelOrderConfirm", { orderNumber: order.orderNumber })))
      return;

    try {
      setCancelling(true);
      await ordersService.cancelOrder(order.uuid);
      await loadOrder();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(t("cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!order) return null;

  const customer = getOrderCustomer(order);
  const whatsAppUrl = toWhatsAppUrl(customer.phone);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera: identidad de la orden y acciones sobre ella */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <Link
          href="/admin/dashboard/ordenes"
          aria-label={t("backToOrders")}
          className="hidden h-[38px] w-[38px] flex-none items-center justify-center rounded-lg border border-sand-300 bg-white text-sand-700 transition-colors hover:bg-sand-100 xl:flex"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href="/admin/dashboard/ordenes"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-brand-600 xl:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToOrders")}
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-ink">
              {t("detailTitle", { orderNumber: order.orderNumber })}
            </h1>
            <Pill tone={orderStatusTone(order.status)}>
              {t(`statuses.${order.status}`)}
            </Pill>
            <Pill tone={paymentStatusTone(order.paymentInfo.status)}>
              {t(`paymentStatuses.${order.paymentInfo.status}`)}
            </Pill>
            <Pill>
              {order.deliveryMethod === "pickup"
                ? t("methodPickup")
                : t("methodDelivery")}
            </Pill>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-medium text-sand-600">
            <span>
              {t("createdAt", {
                date: new Date(order.createdAt).toLocaleString("es-VE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </span>
            <span aria-hidden>·</span>
            <span>
              {t("itemsAndUnits", {
                items: order.items.length,
                units: order.totalItems,
              })}
            </span>
            <span aria-hidden>·</span>
            <span className="font-mono text-[11.5px]">{order.uuid}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-sand-700 transition-colors hover:bg-sand-100"
          >
            <Printer className="h-[15px] w-[15px]" />
            {t("print")}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-sand-700 transition-colors hover:bg-sand-100"
          >
            {copied ? (
              <Check className="h-[15px] w-[15px] text-success-600" />
            ) : (
              <Link2 className="h-[15px] w-[15px]" />
            )}
            {copied ? t("copied") : t("copyLink")}
          </button>
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <MessageSquare className="h-[15px] w-[15px]" />
              {t("writeToCustomer")}
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-col items-start gap-5 xl:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <OrderItemsCard order={order} />
          <DeliveryCard order={order} />
          <PaymentCard order={order} />
          {order.notes && (
            <section className="rounded-2xl border border-sand-300 bg-white p-5">
              <h2 className="mb-2 font-display text-base font-bold text-ink">
                {t("customerNotes")}
              </h2>
              <p className="text-[13px] font-medium leading-relaxed text-sand-700">
                {order.notes}
              </p>
            </section>
          )}
        </div>

        <aside className="flex w-full flex-none flex-col gap-4 xl:w-[352px]">
          <CustomerCard order={order} />
          <ManagementCard
            orderStatus={orderStatus}
            paymentStatus={paymentStatus}
            adminNotes={adminNotes}
            saving={saving}
            cancelling={cancelling}
            isCancelled={order.status === "cancelled"}
            onOrderStatusChange={setOrderStatus}
            onPaymentStatusChange={setPaymentStatus}
            onAdminNotesChange={setAdminNotes}
            onSave={handleSave}
            onCancelOrder={handleCancelOrder}
          />
          <HistoryCard order={order} />
        </aside>
      </div>
    </div>
  );
}
