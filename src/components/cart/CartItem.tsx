"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import type { CartItem as CartItemType, Product } from "@/types";
import { formatVES, formatUSD, parsePrice } from "@/lib/currency";

interface CartItemProps {
  item:
    | CartItemType
    | { productUuid: string; quantity: number; product: Product };
  onUpdateQuantity: (productUuid: string, quantity: number) => Promise<void>;
  onRemove: (productUuid: string) => Promise<void>;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { product, quantity } = item;
  const priceUSD = parsePrice(product.priceWithIva);
  const priceVES = product.priceWithIvaVes
    ? parsePrice(product.priceWithIvaVes)
    : null;
  const subtotalUSD = priceUSD * quantity;
  const subtotalVES = priceVES ? priceVES * quantity : null;

  const primaryImage = product.images?.find((img) => img.isPrimary);
  const imageUrl = primaryImage?.url || "/placeholder-product.png";
  const showPlaceholder =
    !imageUrl || imageUrl === "/placeholder-product.png" || imgError;

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.inventory) return;

    try {
      setLoading(true);
      await onUpdateQuantity(product.uuid, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await onRemove(product.uuid);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex gap-3 py-4 transition-opacity ${loading ? "opacity-50" : ""}`}
    >
      {/* Imagen */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-700/50">
        {showPlaceholder ? (
          <Package className="w-7 h-7 text-gray-400 dark:text-gray-600" />
        ) : (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-snug">
            {product.customName ?? product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
          <div className="mt-1">
            {priceVES && (
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 leading-none">
                {formatVES(priceVES)}
              </p>
            )}
            <p
              className={`leading-none ${priceVES ? "text-xs text-gray-500 mt-0.5" : "text-sm font-semibold text-blue-600 dark:text-blue-400"}`}
            >
              {formatUSD(priceUSD)}
            </p>
          </div>
        </div>

        {quantity > product.inventory && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            Solo {product.inventory} disponibles
          </p>
        )}
      </div>

      {/* Controles */}
      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
        {/* Quantity stepper */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/60">
          <button
            onClick={() => handleUpdateQuantity(quantity - 1)}
            disabled={loading || quantity <= 1}
            className="px-2 py-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2.5 py-1.5 text-sm font-medium text-gray-900 dark:text-white min-w-[2rem] text-center tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity(quantity + 1)}
            disabled={loading || quantity >= product.inventory}
            className="px-2 py-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal + eliminar */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            {subtotalVES && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                {formatVES(subtotalVES)}
              </p>
            )}
            <p
              className={`leading-none ${subtotalVES ? "text-xs text-gray-500 mt-0.5" : "text-sm font-semibold text-gray-900 dark:text-white"}`}
            >
              {formatUSD(subtotalUSD)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-30 transition-colors"
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
