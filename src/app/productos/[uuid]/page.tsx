"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, Loader2 } from "lucide-react";
import { productsService } from "@/services/products";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { Product } from "@/types";
import { formatVES, formatUSD, parsePrice } from "@/lib/currency";

export default function ProductDetailPage() {
  const params = useParams();
  const uuid = params.uuid as string;
  const t = useTranslations('products');
  const tCart = useTranslations('cart');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imgError, setImgError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [uuid]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const foundProduct = await productsService.getByUuid(uuid);
      setProduct(foundProduct);
      const primaryImage = foundProduct.images?.find((img) => img.isPrimary);
      setSelectedImage(primaryImage?.url || foundProduct.images?.[0]?.url || "");
      setImgError(false);
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('notFound')}
        </h1>
        <Link href="/productos" className="text-blue-600 dark:text-blue-400 hover:underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  const priceUSD = parsePrice(product.price);
  const priceVES = product.priceVes ? parsePrice(product.priceVes) : null;
  const isOutOfStock = product.inventory === 0;
  const isLowStock = product.inventory > 0 && product.inventory <= 5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
          {' / '}
          <Link href="/productos" className="hover:text-blue-600 dark:hover:text-blue-400">{t('title')}</Link>
          {' / '}
          <span className="text-gray-900 dark:text-gray-100">{product.customName ?? product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <div
              className="relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-4"
              style={{ paddingTop: "100%" }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-700">
                {selectedImage && !imgError ? (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="object-contain max-w-full max-h-full"
                    priority
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <Package className="w-24 h-24 text-gray-300 dark:text-slate-500" />
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.featured && (
                  <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded">
                    {t('featured')}
                  </span>
                )}
                {isOutOfStock && (
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
                    {tCart('outOfStock')}
                  </span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded">
                    {tCart('lowStock')}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image) => (
                  <button
                    key={image.uuid}
                    onClick={() => { setSelectedImage(image.url); setImgError(false); }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${
                      selectedImage === image.url
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.name} - ${image.order}`}
                      width={150}
                      height={150}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {product.customName ?? product.name}
            </h1>

            {/* SKU */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {tCart('sku')}: {product.sku}
            </p>

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.categories.map((category) => (
                  <a
                    key={category.uuid}
                    href={`/productos?category=${category.slug}`}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              {priceVES && (
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {formatVES(priceVES)}
                </p>
              )}
              <p className={`${priceVES ? 'text-xl text-gray-600 dark:text-gray-400' : 'text-4xl font-bold text-blue-600 dark:text-blue-400'}`}>
                {formatUSD(priceUSD)}
              </p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {product.inventory} {tCart('stock')}
              </span>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">{product.shortDescription}</p>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center dark:text-gray-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {!isOutOfStock && (
              <AddToCartButton
                productUuid={product.uuid}
                quantity={quantity}
                className="w-full mb-4"
              />
            )}

            {isOutOfStock && (
              <button
                disabled
                className="w-full px-6 py-3 bg-gray-300 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
              >
                {tCart('notAvailable')}
              </button>
            )}

            {/* Description */}
            {product.description && (
              <div className="mt-8 pt-8 border-t dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {t('description')}
                </h2>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
