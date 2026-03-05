'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ProductCardImageProps {
  imageUrl: string;
  productName: string;
  priority?: boolean;
  showBadges: boolean;
  featured: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  imageHeight: string;
}

function ProductImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <svg
        className="w-20 h-20 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    </div>
  );
}

export default function ProductCardImage({
  imageUrl,
  productName,
  priority,
  showBadges,
  featured,
  isOutOfStock,
  isLowStock,
  imageHeight,
}: ProductCardImageProps) {
  const tProducts = useTranslations('products');
  const tCart = useTranslations('cart');
  const [imgError, setImgError] = useState(false);

  const showPlaceholder = !imageUrl || imageUrl === "/placeholder-product.png" || imgError;

  return (
    <div className={`relative bg-gray-50 ${imageHeight} flex items-center justify-center p-3 sm:p-6`}>
      {/* Image or placeholder */}
      {showPlaceholder ? (
        <ProductImagePlaceholder />
      ) : (
        <Image
          src={imageUrl}
          alt={productName}
          width={200}
          height={200}
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          priority={priority}
          onError={() => setImgError(true)}
        />
      )}

      {/* Badges */}
      {showBadges && (
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {featured && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
              {tProducts('featured')}
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
              {tCart('outOfStock')}
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
              {tCart('lowStock')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
