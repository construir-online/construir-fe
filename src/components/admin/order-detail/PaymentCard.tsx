"use client";

import { AlertCircle, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order, PaymentStatus } from "@/types";
import { PaymentMethod } from "@/lib/enums";
import {
  resolveBankCode,
  resolveBankName,
  resolvePaymentMethod,
} from "@/lib/payment-helpers";
import { PaymentReceiptViewer } from "@/components/admin/PaymentReceiptViewer";
import { formatUSD, formatVES } from "@/lib/currency";
import { Card, Field, Pill, type PillTone } from "./primitives";

const KNOWN_METHODS: string[] = Object.values(PaymentMethod);

const paymentTones: Record<PaymentStatus, PillTone> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
  refunded: "neutral",
};

/**
 * Pago: los datos que reportó el cliente, su comprobante y el monto exigible.
 *
 * Los campos cambian según el método, pero todos se pintan con la misma retícula
 * en vez de con los paneles de colores por método que usa el detalle público:
 * aquí lo que importa es cotejar contra el comprobante de un vistazo.
 */
export function PaymentCard({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const { paymentInfo } = order;
  const method = resolvePaymentMethod(paymentInfo.method);

  return (
    <Card
      title={t("paymentInfo")}
      icon={<CreditCard className="h-[17px] w-[17px] text-brand-600" />}
      aside={
        <Pill tone={paymentTones[paymentInfo.status] ?? "neutral"}>
          {t(`paymentStatuses.${paymentInfo.status}`)}
        </Pill>
      }
    >
      <div className="flex flex-col gap-[18px] sm:flex-row">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-[18px] gap-y-3.5">
          <Field label={t("paymentMethodLabel")}>
            {/* Se traduce solo lo que conocemos: un método fuera del enum se
                muestra crudo en vez de reventar la tarjeta con una clave que
                no existe. */}
            {!method
              ? t("notReported")
              : KNOWN_METHODS.includes(method)
                ? t(`paymentMethods.${method}`)
                : method}
          </Field>

          {method === PaymentMethod.PAGO_MOVIL && (
            <>
              <Field label={t("issuingBank")}>
                {[
                  resolveBankCode(paymentInfo.bank, paymentInfo.bankCode),
                  resolveBankName(paymentInfo.bank),
                ]
                  .filter(Boolean)
                  .join(" · ") || t("notReported")}
              </Field>
              <Field label={t("issuingPhone")}>
                {paymentInfo.phoneNumber || t("notReported")}
              </Field>
              <Field label={t("payerId")}>
                {paymentInfo.cedula || t("notReported")}
              </Field>
              <Field label={t("reference")} mono>
                {paymentInfo.referenceCode || t("notReported")}
              </Field>
            </>
          )}

          {method === PaymentMethod.TRANSFERENCIA && (
            <>
              <Field label={t("issuingBank")}>
                {resolveBankName(paymentInfo.transferBank) || t("notReported")}
              </Field>
              <Field label={t("accountHolder")}>
                {paymentInfo.accountName || t("notReported")}
              </Field>
              <Field label={t("rif")}>
                {paymentInfo.rif || t("notReported")}
              </Field>
              <Field label={t("accountNumber")} mono>
                {paymentInfo.accountNumber || t("notReported")}
              </Field>
              <Field label={t("reference")} mono>
                {paymentInfo.referenceNumber || t("notReported")}
              </Field>
            </>
          )}

          {method === PaymentMethod.ZELLE && (
            <>
              <Field label={t("senderName")}>
                {paymentInfo.senderName || t("notReported")}
              </Field>
              <Field label={t("senderBank")}>
                {paymentInfo.senderBank || t("notReported")}
              </Field>
            </>
          )}

          <Field label={t("reportedAmount")}>
            <span className="text-sm font-extrabold text-success-600">
              {order.totalVes !== null
                ? formatVES(order.totalVes)
                : formatUSD(order.total)}
              {order.totalVes !== null && (
                <span className="font-medium text-sand-600">
                  {" "}
                  · {formatUSD(order.total)}
                </span>
              )}
            </span>
          </Field>
        </div>

        <div className="flex w-full flex-none flex-col gap-2 sm:w-[150px]">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sand-600">
            {t("paymentReceipt")}
          </span>
          {paymentInfo.hasReceipt ? (
            <PaymentReceiptViewer
              orderUuid={order.uuid}
              orderNumber={order.orderNumber}
              variant="thumbnail"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-sand-300 bg-sand-100 px-3 text-center text-[11.5px] font-semibold text-sand-600">
              {t("noReceipt")}
            </div>
          )}
        </div>
      </div>

      {order.totalVes !== null && order.exchangeRate !== null && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-3.5 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-accent-700" />
          <span className="text-[12.5px] font-medium leading-relaxed text-accent-700">
            {t("rateLockedNote")}
          </span>
        </div>
      )}
    </Card>
  );
}
