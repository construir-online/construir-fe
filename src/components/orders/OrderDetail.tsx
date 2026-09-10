"use client";

import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order, PaymentInfo, TrackedOrder } from "@/types";
import { PaymentMethod } from "@/lib/enums";
import { getOrderStatusColor, getPaymentStatusColor } from "@/lib/order-helpers";
import { resolvePaymentMethod, resolveBankName, resolveBankCode } from "@/lib/payment-helpers";
import { formatUSD, formatVES, parsePrice } from "@/lib/currency";
import { ZellePaymentDetails } from "@/components/admin/payment-details/ZellePaymentDetails";
import { PagoMovilPaymentDetails } from "@/components/admin/payment-details/PagoMovilPaymentDetails";
import { TransferenciaPaymentDetails } from "@/components/admin/payment-details/TransferenciaPaymentDetails";
import { PaymentReceiptViewer } from "@/components/admin/PaymentReceiptViewer";
import PhoneLink from "@/components/common/PhoneLink";
import OrderTimeline from "@/components/orders/OrderTimeline";

/**
 * Importe con el bolívar de protagonista y el dólar como referencia, que es el
 * orden que manda el diseño: el cliente paga en Bs. y el USD sólo le sirve para
 * situarse. Si el backend no trajo el equivalente en Bs. (pedidos viejos,
 * anteriores a que se guardara), se cae al dólar en vez de mostrar un hueco.
 */
function montoPrincipal(
  usd: number | null | undefined,
  ves: number | null | undefined,
): string {
  return ves != null ? formatVES(ves) : formatUSD(usd ?? 0);
}

/**
 * Distingue el pedido completo del recortado del seguimiento público.
 *
 * Hasta ahora `TrackedOrder` se declaraba `Omit<Order, "paymentInfo">`, así que
 * este componente creía tener `uuid`, `shippingAddress`, `trackingNumber`,
 * `discountCode`, `shippingVes` y los datos del pago también en la pantalla
 * pública — donde el backend no manda nada de eso. No se veía porque cada
 * acceso estaba guardado con un `&&` que siempre daba falso; el tipo, en
 * cambio, autorizaba a escribir el acceso sin guarda.
 *
 * Con `TrackedOrder` declarado aparte, TypeScript obliga a preguntar. Se
 * pregunta una sola vez, acá, y el resto del componente lee `completo`.
 */
function esPedidoCompleto(order: Order | TrackedOrder): order is Order {
  return "uuid" in order;
}

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

  // `completo` es null en el seguimiento público: ahí no hay ni uuid, ni
  // dirección, ni datos de pago que mostrar.
  const completo = esPedidoCompleto(order) ? order : null;
  const paymentInfo = order.paymentInfo;
  const paymentMethod = paymentInfo
    ? resolvePaymentMethod(paymentInfo.method)
    : null;
  // Los detalles del pago sólo existen en el pedido completo. Antes el guarda
  // era `!!paymentInfo`, que también da verdadero en el seguimiento —donde
  // `paymentInfo` sí viaja, pero recortado a método y estado.
  const pagoCompleto: PaymentInfo | null = completo?.paymentInfo ?? null;
  const withPaymentDetails = showPaymentDetails && !!pagoCompleto;

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
          {/* Avance del pedido. Va lo primero: es lo que viene a mirar quien ya
              pagó. `verifiedAt` sólo existe en la vista con sesión — el DTO
              público no lo manda — y por eso se pasa con `?.`: la línea se
              dibuja igual, sin fecha en esa etapa. */}
          <OrderTimeline
            pedido={{
              status: order.status,
              deliveryMethod: order.deliveryMethod,
              createdAt: order.createdAt,
              paymentVerifiedAt: pagoCompleto?.verifiedAt ?? null,
              dateCompleted: order.dateCompleted ?? null,
              paymentStatus: order.paymentInfo?.status ?? null,
            }}
          />

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
                    {/* El DTO público declara el SKU anulable; sin renglón que
                        mostrar es mejor no pintar "SKU:" a secas. */}
                    {item.productSku && (
                      <p className="text-sm text-sand-600">{t("sku", { sku: item.productSku })}</p>
                    )}
                    <p className="text-sm text-sand-600">{t("quantity", { quantity: item.quantity })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-medium text-ink">
                      {montoPrincipal(item.subtotal, item.subtotalVes)}
                    </p>
                    {item.subtotalVes != null && (
                      <p className="text-xs text-sand-600">
                        {formatUSD(item.subtotal ?? 0)}
                      </p>
                    )}
                    <p className="text-sm text-sand-600">
                      {t("each", { price: formatUSD(parsePrice(item.price ?? 0)) })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-sand-700">{t("subtotal")}</span>
                <span className="">{montoPrincipal(order.subtotal, order.subtotalVes)}</span>
              </div>
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-sand-700">{t("tax")}</span>
                  <span className="">{montoPrincipal(order.tax, order.taxVes)}</span>
                </div>
              )}
              {(order.shipping ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-sand-700">{t("shipping")}</span>
                  <span className="">{montoPrincipal(order.shipping, completo?.shippingVes ?? null)}</span>
                </div>
              )}
              {(order.discountAmount ?? 0) > 0 ? (
                <div className="flex justify-between text-sm text-success-600">
                  <span>Descuento{completo?.discountCode ? ` (${completo.discountCode})` : ""}:</span>
                  <span>-{montoPrincipal(order.discountAmount, order.discountAmountVes)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="">{t("total")}:</span>
                <div className="text-right">
                  <p className="text-brand-600">{montoPrincipal(order.total, order.totalVes)}</p>
                  {order.totalVes != null && (
                    <p className="text-sm font-normal text-sand-600">{formatUSD(order.total ?? 0)}</p>
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

                {withPaymentDetails && pagoCompleto && (
                  <>
                    {paymentMethod === PaymentMethod.ZELLE && (
                      <ZellePaymentDetails
                        details={{
                          senderName: pagoCompleto.senderName || "",
                          senderBank: pagoCompleto.senderBank || "",
                          receipt: null,
                        }}
                      />
                    )}
                    {paymentMethod === PaymentMethod.PAGO_MOVIL && (
                      <PagoMovilPaymentDetails
                        details={{
                          bank: resolveBankName(pagoCompleto.bank),
                          bankCode: resolveBankCode(pagoCompleto.bank, pagoCompleto.bankCode),
                          phone: pagoCompleto.phoneNumber || "",
                          cedula: pagoCompleto.cedula || "",
                          referenceCode: pagoCompleto.referenceCode || "",
                        }}
                      />
                    )}
                    {paymentMethod === PaymentMethod.TRANSFERENCIA && (
                      <TransferenciaPaymentDetails
                        details={{
                          bank: resolveBankName(pagoCompleto.transferBank),
                          bankCode: pagoCompleto.transferBank?.code || "",
                          beneficiary: pagoCompleto.accountName || "",
                          rif: pagoCompleto.rif || "",
                          accountNumber: pagoCompleto.accountNumber || "",
                          referenceCode: pagoCompleto.referenceNumber || "",
                        }}
                      />
                    )}
                    {pagoCompleto.hasReceipt && (
                      <div>
                        <p className="text-sm text-sand-600 mb-2">{t("paymentReceipt")}</p>
                        <PaymentReceiptViewer
                          orderUuid={completo!.uuid}
                          orderNumber={order.orderNumber}
                        />
                      </div>
                    )}
                    {pagoCompleto.verifiedAt && (
                      <p className="text-sm text-success-600">
                        {t("verifiedOn", { date: formatDate(pagoCompleto.verifiedAt) })}
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
            {completo?.trackingNumber && (
              <p className="mt-3 text-sm text-sand-700">
                <span className="font-medium">{tTracking("trackingNumber")}</span>{" "}
                <span className="font-mono">{completo.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Shipping address */}
          {completo?.shippingAddress && (
            <div className="rounded-2xl border border-sand-300 bg-white p-6">
              <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("shippingAddress")}
              </h2>
              <div className="space-y-1 text-sm text-sand-700">
                <p className="font-medium text-ink">
                  {completo.shippingAddress.firstName} {completo.shippingAddress.lastName}
                </p>
                <p>{completo.shippingAddress.email}</p>
                <p>
                  <PhoneLink
                    phone={completo.shippingAddress.phone}
                    className="hover:text-success-700 hover:underline"
                  />
                </p>
                <p>{completo.shippingAddress.address}</p>
                <p>
                  {completo.shippingAddress.city}, {completo.shippingAddress.state}{" "}
                  {completo.shippingAddress.zipCode}
                </p>
                <p>{completo.shippingAddress.country}</p>
                {completo.shippingAddress.additionalInfo && (
                  <p className="mt-2 pt-2 border-t text-xs italic">
                    {completo.shippingAddress.additionalInfo}
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
