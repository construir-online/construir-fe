"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { formatVES, formatUSD } from "@/lib/currency";
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
  paymentMethod,
  exchangeRate,
  onApplyDiscount,
  discountError,
  isApplyingDiscount,
  variant = "sidebar",
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  const showVES =
    !!paymentMethod && ["pagomovil", "transferencia"].includes(paymentMethod);

  const container =
    variant === "sidebar"
      ? "bg-white dark:bg-gray-800 rounded-lg p-6"
      : "";

  return (
    <div className={container}>
      {variant === "sidebar" && (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.product.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cantidad: {item.quantity}
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {showVES && itemPriceVES
                    ? formatVES(itemPriceVES)
                    : formatUSD(itemPriceUSD)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t dark:border-gray-700 pt-4 space-y-2">
        {showVES && exchangeRate && typeof exchangeRate === "number" && (
          <div className="flex justify-between text-xs bg-blue-50 dark:bg-blue-950/40 p-2 rounded">
            <span className="text-gray-600 dark:text-gray-400">
              Tipo de cambio:
            </span>
            <span className="font-medium">
              1 USD = {exchangeRate.toFixed(2)} Bs
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t("subtotal")}:
          </span>
          <span className="font-medium">
            {showVES && subtotalVES !== null && subtotalVES !== undefined
              ? formatVES(subtotalVES)
              : formatUSD(subtotal)}
          </span>
        </div>

        {ivaAmount > 0 && (
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>IVA:</span>
            <span className="font-medium">
              {showVES && ivaAmountVes > 0
                ? formatVES(ivaAmountVes)
                : formatUSD(ivaAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t("shipping")}:
          </span>
          <span className="font-medium">
            {shipping === 0 ? t("free") : formatUSD(shipping)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
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

        <div className="border-t dark:border-gray-700 pt-2 flex justify-between text-lg font-bold">
          <span className="dark:text-gray-100">{t("total")}:</span>
          <span className="text-blue-600 dark:text-blue-400">
            {showVES && totalVES !== null && totalVES !== undefined
              ? formatVES(totalVES)
              : formatUSD(total)}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <DiscountCodeInput
          onApply={onApplyDiscount}
          error={discountError}
          isApplying={isApplyingDiscount}
        />
      </div>
    </div>
  );
}
