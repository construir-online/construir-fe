"use client";

import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order, TrackedOrder } from "@/types";
import { PaymentMethod } from "@/lib/enums";
import { getOrderStatusColor, getPaymentStatusColor } from "@/lib/order-helpers";
import { resolvePaymentMethod, resolveBankName, resolveBankCode } from "@/lib/payment-helpers";
import { formatUSD, formatVES, parsePrice } from "@/lib/currency";
import { ZellePaymentDetails } from "@/components/admin/payment-details/ZellePaymentDetails";
import { PagoMovilPaymentDetails } from "@/components/admin/payment-details/PagoMovilPaymentDetails";
import { TransferenciaPaymentDetails } from "@/components/admin/payment-details/TransferenciaPaymentDetails";
import { PaymentReceiptViewer } from "@/components/admin/PaymentReceiptViewer";
import PhoneLink from "@/components/common/PhoneLink";

interface OrderDetailProps {
  /** Acepta tanto el pedido completo (admin, mi cuenta) como el recortado del seguimiento público. */
  order: Order | TrackedOrder;
  backLink?: { href: string; label: string };
  /**
   * Muestra los datos del pago (banco, referencia, comprobante).
   *
   * El seguimiento público lo pasa en `false`: esa pantalla se abre con sólo
   * el número de pedido, sin sesión que diga quién está mirando, y el backend
   * ya no envía esos campos. El método de pago y su estado sí se muestran
   * siempre — sirven para explicar que el pago aún está por verificar y no
   * identifican a nadie.
   */
  showPaymentDetails?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetail({
  order,
  backLink,
  showPaymentDetails = true,
}: OrderDetailProps) {
  const t = useTranslations("orders");
  const tTracking = useTranslations("tracking");

  const paymentInfo = order.paymentInfo;
  const paymentMethod = paymentInfo
    ? resolvePaymentMethod(paymentInfo.method)
    : null;
  const withPaymentDetails = showPaymentDetails && !!paymentInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {backLink && (
          <Link href={backLink.href} className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-sand-100">
            <ArrowLeft className="w-5 h-5 text-sand-700" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">
              {t("detailTitle", { orderNumber: order.orderNumber })}
            </h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusColor(order.status)}`}>
              {t(`statuses.${order.status}`)}
            </span>
            {paymentInfo && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusColor(paymentInfo.status)}`}>
                {t(`paymentStatuses.${paymentInfo.status}`)}
              </span>
            )}
          </div>
          <p className="text-sm text-sand-600 mt-1">
            {t("createdAt", { date: formatDate(order.createdAt) })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("orderItems")}
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.uuid} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="text-sm text-sand-600">{t("sku", { sku: item.productSku })}</p>
                    <p className="text-sm text-sand-600">{t("quantity", { quantity: item.quantity })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-medium text-ink">{formatUSD(parsePrice(item.subtotal.toString()))}</p>
                    {item.subtotalVes && (
                      <p className="text-xs text-sand-600">{formatVES(parsePrice(item.subtotalVes.toString()))}</p>
                    )}
                    <p className="text-sm text-sand-600">
                      {t("each", { price: formatUSD(parsePrice(item.price)) })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-sand-700">{t("subtotal")}</span>
                <span className="">{formatUSD(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-sand-700">{t("tax")}</span>
                  <span className="">{formatUSD(order.tax)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-sand-700">{t("shipping")}</span>
                  <span className="">{formatUSD(order.shipping)}</span>
                </div>
              )}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-sm text-success-600">
                  <span>Descuento{order.discountCode ? ` (${order.discountCode})` : ""}:</span>
                  <span>-{formatUSD(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="">{t("total")}:</span>
                <div className="text-right">
                  <p className="text-brand-600">{formatUSD(order.total)}</p>
                  {order.totalVes && (
                    <p className="text-sm font-normal text-sand-600">{formatVES(order.totalVes)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          {paymentInfo && (
            <div className="rounded-2xl border border-sand-300 bg-white p-6">
              <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t("paymentInfo")}
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-sand-700">
                  <span className="font-medium">{t("paymentMethodLabel")}</span>{" "}
                  {t(`paymentMethods.${paymentInfo.method}`)}
                </p>

                {withPaymentDetails && (
                  <>
                    {paymentMethod === PaymentMethod.ZELLE && (
                      <ZellePaymentDetails
                        details={{
                          senderName: paymentInfo.senderName || "",
                          senderBank: paymentInfo.senderBank || "",
                          receipt: null,
                        }}
                      />
                    )}
                    {paymentMethod === PaymentMethod.PAGO_MOVIL && (
                      <PagoMovilPaymentDetails
                        details={{
                          bank: resolveBankName(paymentInfo.bank),
                          bankCode: resolveBankCode(paymentInfo.bank, paymentInfo.bankCode),
                          phone: paymentInfo.phoneNumber || "",
                          cedula: paymentInfo.cedula || "",
                          referenceCode: paymentInfo.referenceCode || "",
                        }}
                      />
                    )}
                    {paymentMethod === PaymentMethod.TRANSFERENCIA && (
                      <TransferenciaPaymentDetails
                        details={{
                          bank: resolveBankName(paymentInfo.transferBank),
                          bankCode: paymentInfo.transferBank?.code || "",
                          beneficiary: paymentInfo.accountName || "",
                          rif: paymentInfo.rif || "",
                          accountNumber: paymentInfo.accountNumber || "",
                          referenceCode: paymentInfo.referenceNumber || "",
                        }}
                      />
                    )}
                    {paymentInfo.hasReceipt && (
                      <div>
                        <p className="text-sm text-sand-600 mb-2">{t("paymentReceipt")}</p>
                        <PaymentReceiptViewer
                          orderUuid={order.uuid}
                          orderNumber={order.orderNumber}
                        />
                      </div>
                    )}
                    {paymentInfo.verifiedAt && (
                      <p className="text-sm text-success-600">
                        {t("verifiedOn", { date: formatDate(paymentInfo.verifiedAt) })}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery */}
          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {tTracking("delivery")}
            </h2>
            <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-sm rounded-full font-medium">
              {order.deliveryMethod === "pickup"
                ? tTracking("deliveryPickup")
                : tTracking("deliveryShipping")}
            </span>
            {order.trackingNumber && (
              <p className="mt-3 text-sm text-sand-700">
                <span className="font-medium">{tTracking("trackingNumber")}</span>{" "}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="rounded-2xl border border-sand-300 bg-white p-6">
              <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("shippingAddress")}
              </h2>
              <div className="space-y-1 text-sm text-sand-700">
                <p className="font-medium text-ink">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.email}</p>
                <p>
                  <PhoneLink
                    phone={order.shippingAddress.phone}
                    className="hover:text-success-700 hover:underline"
                  />
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.additionalInfo && (
                  <p className="mt-2 pt-2 border-t text-xs italic">
                    {order.shippingAddress.additionalInfo}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
