"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import OrderSummary, { type OrderSummaryItem } from "./OrderSummary";

interface OrderSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function OrderSummarySheet({
  isOpen,
  onClose,
  ...summaryProps
}: OrderSummarySheetProps) {
  const t = useTranslations("checkout");
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-summary-sheet-title"
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 overscroll-contain"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div
            className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700 shrink-0">
          <h2
            id="order-summary-sheet-title"
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            {t("orderSummary")}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            style={{ touchAction: "manipulation" }}
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <OrderSummary variant="sheet" {...summaryProps} />
        </div>
      </div>
    </div>
  );
}
