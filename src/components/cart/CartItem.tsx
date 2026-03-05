"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import type { CartItem as CartItemType, Product } from "@/types";
import { formatVES, formatUSD, parsePrice } from "@/lib/currency";

interface CartItemProps {
  item: CartItemType | { productUuid: string; quantity: number; product: Product };
  onUpdateQuantity: (itemUuid: string, productUuid: string, quantity: number) => Promise<void>;
  onRemove: (itemUuid: string, productUuid: string) => Promise<void>;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const itemUuid = 'uuid' in item ? item.uuid : '';
  const { product, quantity } = item;
  const priceUSD = parsePrice(product.price);
  const priceVES = product.priceVes ? parsePrice(product.priceVes) : null;
  const subtotalUSD = priceUSD * quantity;
  const subtotalVES = priceVES ? priceVES * quantity : null;

  const primaryImage = product.images?.find((img) => img.isPrimary);
  const imageUrl = primaryImage?.url || "/placeholder-product.png";

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.inventory) return;

    try {
      setLoading(true);
      await onUpdateQuantity(itemUuid, product.uuid , newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await onRemove(itemUuid, product.uuid);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b">
      {/* Imagen del producto */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {!imageUrl || imageUrl === "/placeholder-product.png" || imgError ? (
          <Package className="w-8 h-8 text-gray-400" />
        ) : (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
        <div className="mt-1">
          {priceVES && (
            <p className="text-lg font-semibold text-blue-600">
              {formatVES(priceVES)}
            </p>
          )}
          <p className={`${priceVES ? 'text-xs text-gray-600' : 'text-lg font-semibold text-blue-600'}`}>
            {formatUSD(priceUSD)}
          </p>
        </div>

        {/* Stock warning */}
        {quantity > product.inventory && (
          <p className="text-xs text-red-600 mt-1">
            Solo {product.inventory} disponibles
          </p>
        )}
      </div>

      {/* Controles de cantidad */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => handleUpdateQuantity(quantity - 1)}
            disabled={loading || quantity <= 1}
            className="p-1 hover:bg-gray-200 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-medium min-w-[2rem] text-center">
            {quantity}
          </span>

          <button
            onClick={() => handleUpdateQuantity(quantity + 1)}
            disabled={loading || quantity >= product.inventory}
            className="p-1 hover:bg-gray-200 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Subtotal y botón eliminar */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            {subtotalVES && (
              <p className="text-sm font-semibold text-gray-900">
                {formatVES(subtotalVES)}
              </p>
            )}
            <p className={`${subtotalVES ? 'text-xs text-gray-600' : 'text-sm font-semibold text-gray-900'}`}>
              {formatUSD(subtotalUSD)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
