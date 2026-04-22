"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { parsePrice } from "@/lib/currency";
import { useProductCardVariant } from "./hooks/useProductCardVariant";
import ProductCardImage from "./ProductCardImage";
import ProductCardContent from "./ProductCardContent";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
  showAddToCart?: boolean;
  showBadges?: boolean;
  showSku?: boolean;
  showDescription?: boolean;
  showStock?: boolean;
  priority?: boolean;
}

export default function ProductCard({
  product,
  variant = "default",
  showAddToCart = false,
  showBadges = true,
  showSku = false,
  showDescription = true,
  showStock = true,
  priority = false,
}: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.isPrimary);
  const imageUrl = primaryImage?.url || "/placeholder-product.png";
  const priceUSD = parsePrice(product.priceWithIva);
  const priceVES = product.priceWithIvaVes
    ? parsePrice(product.priceWithIvaVes)
    : null;

  const router = useRouter();
  const { classes, isLowStock, isOutOfStock } = useProductCardVariant({
    variant,
    inventory: product.inventory,
  });

  return (
    <div
      className="block group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/productos/${product.uuid}`)}
    >
      {/* Image Section */}
      <ProductCardImage
        imageUrl={imageUrl}
        productName={product.name}
        priority={priority}
        showBadges={showBadges}
        featured={product.featured}
        isOutOfStock={isOutOfStock}
        isLowStock={isLowStock}
        imageHeight={classes.imageHeight}
      />

      {/* Content Section */}
      <ProductCardContent
        product={product}
        variant={variant}
        classes={classes}
        showSku={showSku}
        showDescription={showDescription}
        showStock={showStock}
        showAddToCart={showAddToCart}
        priceUSD={priceUSD}
        priceVES={priceVES}
        isOutOfStock={isOutOfStock}
      />
    </div>
  );
}
