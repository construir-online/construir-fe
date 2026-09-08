"use client";

import { useEffect, useState } from "react";
import { X, ShoppingBag, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { resolveCartProducts } from "@/services/products";
import { localCartService } from "@/services/cart";
import CartItem from "./CartItem";
import type { Product } from "@/types";
import { formatVES, formatUSD, parsePrice } from "@/lib/currency";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations("cart");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    cart,
    localCart,
    loading: cartLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    refreshCart,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);


  const totalItems = getTotalItems();

  // Cargar productos para el carrito local cuando se abre el drawer
  useEffect(() => {
    if (!isOpen || isAuthenticated || localCart.items.length === 0) return;

    const cartUuids = localCart.items.map((item) => item.productUuid);
    const loadedUuids = new Set(products.map((p) => p.uuid));
    const needsLoading = cartUuids.some((uuid) => !loadedUuids.has(uuid));

    if (needsLoading) {
      loadLocalCartProducts();
    }
  }, [isOpen, isAuthenticated, localCart.items]);

  /**
   * Resuelve los productos del carrito por uuid.
   *
   * Antes se pedía la primera página del catálogo (`limit: 100`) y se purgaba
   * de `localStorage` todo lo que no viniera en ella: con 1089 productos
   * publicados, cualquiera fuera de los 100 más recientes se auto-borraba del
   * carrito. Ahora sólo se purga lo que responde 404; un fallo de red deja el
   * carrito intacto.
   */
  const loadLocalCartProducts = async () => {
    try {
      setLoadingProducts(true);
      const { found, gone } = await resolveCartProducts(
        localCart.items.map((item) => item.productUuid),
      );
      setProducts(found);

      if (gone.length > 0) {
        const borrados = new Set(gone);
        localCartService.saveCart({
          items: localCart.items.filter(
            (item) => !borrados.has(item.productUuid),
          ),
        });
        await refreshCart();
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Calcular items enriquecidos para carrito local
  const enrichedLocalItems = localCart.items
    .map((item) => {
      const product = products.find((p) => p.uuid === item.productUuid);
      if (!product) return null;

      return {
        productUuid: item.productUuid,
        quantity: item.quantity,
        product,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const items = isAuthenticated ? cart?.items || [] : enrichedLocalItems;
  const subtotal = isAuthenticated
    ? cart?.subtotal || 0
    : enrichedLocalItems.reduce((acc, item) => {
        const price =
          typeof item.product.priceWithIva === "string"
            ? parseFloat(item.product.priceWithIva)
            : item.product.priceWithIva;
        return acc + price * item.quantity;
      }, 0);

  const subtotalVES = isAuthenticated
    ? cart?.subtotalVes || null
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item.product.priceWithIvaVes) return acc;
        const priceVes = parsePrice(item.product.priceWithIvaVes);
        return acc + priceVes * item.quantity;
      }, 0);

  const handleClearCart = async () => {
    if (confirm(t("clearCartConfirm"))) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    router.push("/checkout");
    onClose();
  };

  // Cerrar drawer con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-sand-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-300 bg-white/95">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600/20 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink leading-none">
                {t("title")}
              </h2>
              <p className="text-xs text-sand-600 mt-0.5">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sand-600 hover:text-ink hover:bg-sand-100 rounded-lg transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-sand-400 scrollbar-track-transparent">
          {cartLoading || loadingProducts ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-sm text-sand-600">
                Cargando carrito…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="p-6 bg-sand-100 rounded-2xl">
                <ShoppingBag className="w-14 h-14 text-sand-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-sand-700 mb-1">
                  {t("empty")}
                </h3>
                <p className="text-sm text-sand-600 max-w-[200px]">
                  {t("emptyDescription")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-sand-300">
              {items.map((item, index) => (
                <CartItem
                  key={index}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}

              {/* Botón vaciar carrito */}
              <div className="pt-3 pb-1">
                <button
                  onClick={handleClearCart}
                  className="w-full py-2 text-xs text-danger-500 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors"
                >
                  {t("clearCart")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-sand-300 bg-sand-50 px-5 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-sand-600">
                {t("subtotal")}
              </span>
              <div className="text-right">
                {subtotalVES && subtotalVES > 0 && (
                  <div className="text-lg font-bold text-ink">
                    {formatVES(subtotalVES)}
                  </div>
                )}
                <div
                  className={`font-bold ${
                    subtotalVES && subtotalVES > 0
                      ? "text-sm text-sand-600"
                      : "text-lg text-ink"
                  }`}
                >
                  {formatUSD(subtotal)}
                </div>
              </div>
            </div>

            {/* Botón checkout */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-500 active:bg-brand-700 transition-colors shadow-lg shadow-brand-900/30"
            >
              {t("checkout")}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-sand-600 hover:text-ink hover:bg-sand-100 rounded-xl transition-colors"
            >
              {t("continueShopping")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
