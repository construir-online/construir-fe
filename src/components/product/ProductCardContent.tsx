'use client';

import { Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AddToCartButton from '../cart/AddToCartButton';
import { formatVES, formatUSD } from '@/lib/currency';
import type { Product } from '@/types';

interface ProductCardContentProps {
  product: Product;
  variant: 'default' | 'compact';
  classes: {
    padding: string;
    nameSize: string;
    priceSize: string;
    categorySize: string;
    minHeight: string;
    spacingY: string;
  };
  showSku: boolean;
  showDescription: boolean;
  showStock: boolean;
  showAddToCart: boolean;
  priceUSD: number;
  priceVES: number | null;
  isOutOfStock: boolean;
}

export default function ProductCardContent({
  product,
  variant,
  classes,
  showSku,
  showDescription,
  showStock,
  showAddToCart,
  priceUSD,
  priceVES,
  isOutOfStock,
}: ProductCardContentProps) {
  const tCart = useTranslations('cart');
  const isCompact = variant === 'compact';

  return (
    <div className={`${classes.padding} ${classes.spacingY}`}>
      {/* Categories */}
      {product.categories && product.categories.length > 0 && (
        <div className={`${classes.categorySize} font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide`}>
          {isCompact ? (
            // Compact: solo primera categoría
            <span>{product.categories[0]?.name}</span>
          ) : (
            // Default: hasta 2 categorías clickeables
            <div className="flex flex-wrap gap-1">
              {product.categories.slice(0, 2).map((category) => (
                <span
                  key={category.uuid}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nombre del producto */}
      <h3 className={`${classes.nameSize} text-gray-800 dark:text-gray-200 line-clamp-2 ${classes.minHeight} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
        {product.customName ?? product.name}
      </h3>

      {/* SKU - solo si showSku y no compact */}
      {showSku && !isCompact && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{tCart('sku')}: {product.sku}</p>
      )}

      {/* Descripción corta - solo si showDescription y no compact */}
      {showDescription && !isCompact && product.shortDescription && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 hidden sm:block">
          {product.shortDescription}
        </p>
      )}

      {/* Precio */}
      <div className="flex items-baseline gap-1">
        <div className="flex-1">
          {priceVES && (
            <p className={`${classes.priceSize} font-bold text-blue-600`}>{formatVES(priceVES)}</p>
          )}
          <p className={`${priceVES ? 'text-xs text-gray-500 dark:text-gray-400' : `${classes.priceSize} font-bold text-blue-600 dark:text-blue-400`}`}>
            {formatUSD(priceUSD)}
          </p>
        </div>
      </div>

      {/* Stock - solo si showStock y no compact */}
      {showStock && !isCompact && (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Package className="w-4 h-4" />
          <span>{product.inventory} {tCart('stock')}</span>
        </div>
      )}

      {/* Botón agregar al carrito - solo si showAddToCart */}
      {showAddToCart && product.published && !isOutOfStock && (
        <AddToCartButton
          productUuid={product.uuid}
          quantity={1}
          className="w-full"
          showStepper={true}
        />
      )}

      {showAddToCart && isOutOfStock && (
        <button
          disabled
          className="w-full px-6 py-3 bg-gray-300 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
        >
          {tCart('notAvailable')}
        </button>
      )}
    </div>
  );
}
