"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  Loader2,
  Package,
  Store,
  Truck,
} from "lucide-react";
import { productsService } from "@/services/products";
import CartStepper from "@/components/cart/CartStepper";
import Accordion from "@/components/ui/Accordion";
import { useExchangeRate, formatRate } from "@/hooks/useExchangeRate";
import type { Product } from "@/types";
import { formatVES, formatUSD, parsePrice } from "@/lib/currency";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  const t = useTranslations("products");
  const tCart = useTranslations("cart");
  const { rate } = useExchangeRate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [uuid]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const foundProduct = await productsService.getByUuid(uuid);
      setProduct(foundProduct);
      const primaryImage = foundProduct.images?.find((img) => img.isPrimary);
      setSelectedImage(
        primaryImage?.url || foundProduct.images?.[0]?.url || "",
      );
      setImgError(false);
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t("notFound")}</h1>
        <Link href="/productos" className="font-bold text-brand-600 hover:text-brand-700">
          Volver a productos
        </Link>
      </div>
    );
  }

  const priceUSD = parsePrice(product.priceWithIva);
  const priceVES = product.priceWithIvaVes ? parsePrice(product.priceWithIvaVes) : null;
  const isOutOfStock = product.inventory === 0;
  const isLowStock = product.inventory > 0 && product.inventory <= 5;
  const images = product.images ?? [];
  const heroPrice = priceVES ? formatVES(priceVES) : formatUSD(priceUSD);

  /**
   * Texto del botón con el total de lo que se va a agregar, no con el precio
   * de una unidad. En una compra de obra se llevan varias, y ver "5" al lado
   * del importe de uno solo hace dudar de si el carrito va a cobrar bien.
   *
   * El bolívar manda y el dólar acompaña, como en el resto de la app.
   */
  const addLabel = (cantidad: number) =>
    `${tCart("addToCart")} · ${
      priceVES ? formatVES(priceVES * cantidad) : formatUSD(priceUSD * cantidad)
    }`;

  return (
    <div className="min-h-screen bg-white pb-32 md:pb-10">
      <div className="mx-auto max-w-7xl md:px-6 md:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Galería */}
          <div>
            <div className="relative h-[248px] w-full overflow-hidden bg-sand-100 sm:h-[340px] md:aspect-[4/3] md:h-auto md:rounded-2xl md:border md:border-sand-300">
              {selectedImage && !imgError ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-20 w-20 text-sand-500" strokeWidth={1.4} />
                </div>
              )}

              {/* Volver, sobre la foto en móvil */}
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Volver"
                className="absolute left-4 top-[calc(0.875rem+env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white/92 text-ink backdrop-blur-sm md:hidden"
              >
                <ArrowLeft className="h-[17px] w-[17px]" />
              </button>

              {product.featured && (
                <span className="absolute right-4 top-[calc(0.875rem+env(safe-area-inset-top))] z-10 rounded-lg bg-accent-500 px-2.5 py-1.5 text-[11px] font-extrabold text-ink md:top-4">
                  {t("featured")}
                </span>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65">
                  <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-sand-700">
                    {tCart("outOfStock")}
                  </span>
                </div>
              )}

              {/* Indicadores de galería */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:hidden">
                  {images.map((image) => (
                    <button
                      key={image.uuid}
                      type="button"
                      onClick={() => {
                        setSelectedImage(image.url);
                        setImgError(false);
                      }}
                      aria-label={`Ver imagen ${image.order + 1}`}
                      className={`h-[5px] rounded-full transition-all ${
                        selectedImage === image.url ? "w-5 bg-ink" : "w-[5px] bg-ink/25"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniaturas en escritorio */}
            {images.length > 1 && (
              <div className="mt-4 hidden grid-cols-5 gap-2 md:grid">
                {images.map((image) => (
                  <button
                    key={image.uuid}
                    onClick={() => {
                      setSelectedImage(image.url);
                      setImgError(false);
                    }}
                    className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImage === image.url
                        ? "border-brand-600"
                        : "border-sand-300 hover:border-brand-300"
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

          {/* Ficha */}
          <div className="flex flex-col gap-3.5 px-4 pt-4 md:px-0 md:pt-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-sand-600">
              {product.categories?.[0]?.name ?? t("title")} · {tCart("sku")} {product.sku}
            </p>

            <h1 className="font-display text-[22px] font-bold leading-[1.22] text-ink md:text-3xl">
              {product.customName ?? product.name}
            </h1>

            {/* Precio dual con la tasa a la vista */}
            <div>
              <p className="text-[26px] font-extrabold leading-none text-ink md:text-4xl">
                {heroPrice}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-sand-600">
                {priceVES ? `${formatUSD(priceUSD)} · ` : ""}IVA incluido
                {rate !== null && ` · tasa BCV ${formatRate(rate)}`}
              </p>
            </div>

            {/* Disponibilidad y entrega */}
            <div className="flex flex-wrap gap-2">
              {isOutOfStock ? (
                <span className="rounded-full bg-sand-100 px-3 py-1.5 text-[11.5px] font-bold text-sand-700">
                  {tCart("outOfStock")}
                </span>
              ) : (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
                    isLowStock
                      ? "bg-accent-100 text-accent-700"
                      : "bg-success-50 text-success-600"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  {product.inventory} {tCart("stock")}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-100 px-3 py-1.5 text-[11.5px] font-semibold text-sand-700">
                <Store className="h-3.5 w-3.5" strokeWidth={2} />
                Retiro en tienda
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-100 px-3 py-1.5 text-[11.5px] font-semibold text-sand-700">
                <Truck className="h-3.5 w-3.5" strokeWidth={2} />
                Delivery 24 h
              </span>
            </div>

            {/* Categorías */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <Link
                    key={category.uuid}
                    href={`/productos?categoria=${category.uuid}`}
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-[11.5px] font-semibold text-brand-600 transition-colors hover:bg-brand-100"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Añadir al carrito en escritorio */}
            <div className="mt-2 hidden md:block">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-sand-300 px-6 py-3.5 text-sm font-bold text-sand-600"
                >
                  {tCart("notAvailable")}
                </button>
              ) : (
                <CartStepper
                  productUuid={product.uuid}
                  inventory={product.inventory}
                  className="w-full"
                  addLabel={addLabel}
                  conSelectorDeCantidad
                />
              )}
            </div>

            {/* Detalle plegable */}
            <div className="mt-3 flex flex-col">
              {(product.description || product.shortDescription) && (
                <Accordion title={t("description")} defaultOpen>
                  <p className="whitespace-pre-line">
                    {product.description || product.shortDescription}
                  </p>
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra fija al borde inferior: en esta pantalla no hay navegación inferior */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-300 bg-white px-4 pb-[calc(1.375rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-xl border-[1.5px] border-sand-300 px-6 py-3.5 text-sm font-bold text-sand-600"
          >
            {tCart("notAvailable")}
          </button>
        ) : (
          <CartStepper
            productUuid={product.uuid}
            inventory={product.inventory}
            className="w-full"
            addLabel={addLabel}
            conSelectorDeCantidad
          />
        )}
      </div>
    </div>
  );
}
