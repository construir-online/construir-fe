"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { formatVES, formatUSD } from "@/lib/currency";
import { formatRate } from "@/hooks/useExchangeRate";
import DiscountCodeInput from "./DiscountCodeInput";

export interface OrderSummaryItem {
  quantity: number;
  product: {
    uuid: string;
    name: string;
    priceWithIva: number;
    priceWithIvaVes: number;
  };
}

interface OrderSummaryProps {
  items: readonly (OrderSummaryItem | null)[];
  subtotal: number;
  subtotalVES: number | null;
  ivaAmount: number;
  ivaAmountVes: number;
  shipping: number;
  discountCode: string | null;
  discountAmount: number;
  discountAmountVes: number | null;
  total: number;
  totalVES: number | null;
  paymentMethod: string | undefined;
  exchangeRate: number | null;
  onApplyDiscount: (code: string) => Promise<void>;
  discountError: string | null;
  isApplyingDiscount: boolean;
  variant?: "sidebar" | "sheet";
}

export default function OrderSummary({
  items,
  subtotal,
  subtotalVES,
  ivaAmount,
  ivaAmountVes,
  shipping,
  discountCode,
  discountAmount,
  discountAmountVes,
  total,
  totalVES,
  exchangeRate,
  onApplyDiscount,
  discountError,
  isApplyingDiscount,
  variant = "sidebar",
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  // El precio es dual en toda la app: Bs. protagonista y USD de referencia, sin
  // depender del método de pago elegido.
  const showVES = totalVES !== null && totalVES !== undefined && totalVES > 0;

  const container =
    variant === "sidebar"
      ? "rounded-2xl border border-sand-300 bg-white p-5"
      : "";

  return (
    <div className={container}>
      {variant === "sidebar" && (
        <h2 className="mb-4 font-display text-lg font-bold text-ink">
          {t("orderSummary")}
        </h2>
      )}

      <div
        className={`space-y-3 mb-6 overflow-y-auto overscroll-contain ${
          variant === "sidebar" ? "max-h-64" : "max-h-[40vh]"
        }`}
      >
        {items.map((item) => {
          if (!item) return null;
          const itemPriceUSD = item.product.priceWithIva * item.quantity;
          const itemPriceVES = item.product.priceWithIvaVes
            ? item.product.priceWithIvaVes * item.quantity
            : null;

          return (
            <div key={item.product.uuid} className="flex gap-3">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl border border-sand-300 bg-sand-100">
                <Package className="h-6 w-6 text-sand-500" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-ink">
                  {item.product.name}
                </p>
                <p className="text-[11.5px] font-medium text-sand-600">
                  Cantidad: {item.quantity}
                </p>
                <p className="text-sm font-extrabold text-ink">
                  {showVES && itemPriceVES
                    ? formatVES(itemPriceVES)
                    : formatUSD(itemPriceUSD)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5 border-t border-sand-200 pt-4">
        {showVES && exchangeRate && typeof exchangeRate === "number" && (
          <div className="flex justify-between rounded-lg bg-sand-100 p-2.5 text-xs font-semibold">
            <span className="text-sand-700">
              Tipo de cambio:
            </span>
            <span className="font-medium">
              1 USD = {formatRate(exchangeRate)} Bs
            </span>
          </div>
        )}

        <div className="flex justify-between text-[13px] font-semibold text-sand-700">
          <span>
            {t("subtotal")}:
          </span>
          <span className="font-medium">
            {showVES && subtotalVES !== null && subtotalVES !== undefined
              ? formatVES(subtotalVES)
              : formatUSD(subtotal)}
          </span>
        </div>

        {ivaAmount > 0 && (
          <div className="flex justify-between text-[13px] font-semibold text-sand-700">
            <span>IVA:</span>
            <span className="font-medium">
              {showVES && ivaAmountVes > 0
                ? formatVES(ivaAmountVes)
                : formatUSD(ivaAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[13px] font-semibold text-sand-700">
          <span>
            {t("shipping")}:
          </span>
          <span className="font-medium">
            {shipping === 0 ? t("free") : formatUSD(shipping)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-[13px] font-semibold text-success-600">
            <span className="font-medium">
              {t("discount")} ({discountCode}):
            </span>
            <span className="font-medium">
              -
              {showVES && discountAmountVes !== null
                ? formatVES(discountAmountVes)
                : formatUSD(discountAmount)}
            </span>
          </div>
        )}

        <div className="flex items-baseline justify-between border-t border-sand-200 pt-3">
          <span className="font-display text-[15px] font-bold text-ink">{t("total")}</span>
          <div className="text-right">
            <span className="block text-[19px] font-extrabold text-ink">
              {showVES && totalVES !== null && totalVES !== undefined
                ? formatVES(totalVES)
                : formatUSD(total)}
            </span>
            {showVES && totalVES !== null && totalVES !== undefined && (
              <span className="text-[11.5px] font-medium text-sand-600">
                ≈ {formatUSD(total)}
                {exchangeRate && typeof exchangeRate === "number"
                  ? ` · BCV ${formatRate(exchangeRate)}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DiscountCodeInput
          onApply={onApplyDiscount}
          error={discountError}
          isApplying={isApplyingDiscount}
          bare={variant !== "sidebar"}
        />
      </div>
    </div>
  );
}
