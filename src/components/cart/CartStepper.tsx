"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";

interface CartStepperProps {
  productUuid: string;
  inventory?: number;
  className?: string;
  compact?: boolean;
}

export default function CartStepper({
  productUuid,
  inventory,
  className = "",
  compact = false,
}: CartStepperProps) {
  const t = useTranslations("cart");
  const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();
  const [loading, setLoading] = useState(false);

  const currentQty = getItemQuantity(productUuid);
  const isAtStockLimit = inventory !== undefined && currentQty >= inventory;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await addToCart(productUuid, 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtStockLimit) return;
    try {
      setLoading(true);
      await addToCart(productUuid, 1);
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      if (currentQty === 1) {
        await removeFromCart(productUuid);
      } else {
        await updateQuantity(productUuid, currentQty - 1);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  if (currentQty > 0) {
    return (
      <div
        className={`flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDecrease}
          disabled={loading}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Disminuir cantidad"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[2ch] text-center">
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : currentQty}
        </span>
        <button
          onClick={handleIncrease}
          disabled={loading || isAtStockLimit}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Aumentar cantidad"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'px-3 py-2' : 'px-6 py-3'} ${className}`}
    >
      {loading ? (
        <Loader2 className={compact ? 'w-4 h-4 animate-spin' : 'w-5 h-5 animate-spin'} />
      ) : (
        <ShoppingCart className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      )}
      <span className={compact ? 'hidden sm:inline' : ''}>{t("addToCart")}</span>
    </button>
  );
}
