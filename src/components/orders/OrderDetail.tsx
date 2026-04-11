"use client";

import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order } from "@/types";
import { PaymentMethod } from "@/lib/enums";
import { getOrderStatusColor, getPaymentStatusColor } from "@/lib/order-helpers";
import { resolvePaymentMethod, resolveBankName, resolveBankCode } from "@/lib/payment-helpers";
import { formatUSD, formatVES, parsePrice } from "@/lib/currency";
import { ZellePaymentDetails } from "@/components/admin/payment-details/ZellePaymentDetails";
import { PagoMovilPaymentDetails } from "@/components/admin/payment-details/PagoMovilPaymentDetails";
import { TransferenciaPaymentDetails } from "@/components/admin/payment-details/TransferenciaPaymentDetails";
import { PaymentReceiptViewer } from "@/components/admin/PaymentReceiptViewer";

interface OrderDetailProps {
  order: Order;
  backLink?: { href: string; label: string };
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

export function OrderDetail({ order, backLink }: OrderDetailProps) {
  const t = useTranslations("orders");
  const tTracking = useTranslations("tracking");

  const paymentMethod = resolvePaymentMethod(order.paymentInfo.method);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {backLink && (
          <Link href={backLink.href} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg mt-1 shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("detailTitle", { orderNumber: order.orderNumber })}
            </h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
              {t(`statuses.${order.status}`)}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.paymentInfo.status)}`}>
              {t(`paymentStatuses.${order.paymentInfo.status}`)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("createdAt", { date: formatDate(order.createdAt) })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("orderItems")}
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.uuid} className="flex justify-between items-start border-b dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("sku", { sku: item.productSku })}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("quantity", { quantity: item.quantity })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatUSD(parsePrice(item.subtotal.toString()))}</p>
                    {item.subtotalVes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatVES(parsePrice(item.subtotalVes.toString()))}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("each", { price: formatUSD(parsePrice(item.price)) })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t dark:border-slate-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t("subtotal")}</span>
                <span className="dark:text-gray-200">{formatUSD(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t("tax")}</span>
                  <span className="dark:text-gray-200">{formatUSD(order.tax)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t("shipping")}</span>
                  <span className="dark:text-gray-200">{formatUSD(order.shipping)}</span>
                </div>
              )}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Descuento{order.discountCode ? ` (${order.discountCode})` : ""}:</span>
                  <span>-{formatUSD(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold border-t dark:border-slate-700 pt-2">
                <span className="dark:text-gray-100">{t("total")}:</span>
                <div className="text-right">
                  <p className="text-blue-600 dark:text-blue-400">{formatUSD(order.total)}</p>
                  {order.totalVes && (
                    <p className="text-sm font-normal text-gray-500 dark:text-gray-400">{formatVES(order.totalVes)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t("paymentInfo")}
            </h2>
            <div className="space-y-4">
              {paymentMethod === PaymentMethod.ZELLE && (
                <ZellePaymentDetails
                  details={{
                    senderName: order.paymentInfo.senderName || "",
                    senderBank: order.paymentInfo.senderBank || "",
                    receipt: null,
                  }}
                />
              )}
              {paymentMethod === PaymentMethod.PAGO_MOVIL && (
                <PagoMovilPaymentDetails
                  details={{
                    bank: resolveBankName(order.paymentInfo.bank),
                    bankCode: resolveBankCode(order.paymentInfo.bank, order.paymentInfo.bankCode),
                    phone: order.paymentInfo.phoneNumber || "",
                    cedula: order.paymentInfo.cedula || "",
                    referenceCode: order.paymentInfo.referenceCode || "",
                  }}
                />
              )}
              {paymentMethod === PaymentMethod.TRANSFERENCIA && (
                <TransferenciaPaymentDetails
                  details={{
                    bank: resolveBankName(order.paymentInfo.transferBank),
                    bankCode: order.paymentInfo.transferBank?.code || "",
                    beneficiary: order.paymentInfo.accountName || "",
                    rif: order.paymentInfo.rif || "",
                    accountNumber: order.paymentInfo.accountNumber || "",
                    referenceCode: order.paymentInfo.referenceNumber || "",
                  }}
                />
              )}
              {order.paymentInfo.receiptUrl && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("paymentReceipt")}</p>
                  <PaymentReceiptViewer
                    receiptUrl={order.paymentInfo.receiptUrl}
                    orderNumber={order.orderNumber}
                  />
                </div>
              )}
              {order.paymentInfo.verifiedAt && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t("verifiedOn", { date: formatDate(order.paymentInfo.verifiedAt) })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {tTracking("delivery")}
            </h2>
            <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium">
              {order.deliveryMethod === "pickup"
                ? tTracking("deliveryPickup")
                : tTracking("deliveryShipping")}
            </span>
            {order.trackingNumber && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{tTracking("trackingNumber")}</span>{" "}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("shippingAddress")}
              </h2>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.email}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.additionalInfo && (
                  <p className="mt-2 pt-2 border-t dark:border-slate-700 text-xs italic">
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
