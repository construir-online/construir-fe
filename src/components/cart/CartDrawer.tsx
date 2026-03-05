"use client";

import { useEffect, useState } from "react";
import { X, ShoppingBag, Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getProducts } from "@/services/products";
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
  const { token } = useAuth();
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

  const isAuthenticated = !!token;
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

  const loadLocalCartProducts = async () => {
    try {
      setLoadingProducts(true);
      const productUuids = localCart.items.map((item) => item.productUuid);

      const response = await getProducts({ page: 1, limit: 100 });
      const matchedProducts = response.data.filter((p) =>
        productUuids.includes(p.uuid)
      );
      setProducts(matchedProducts);

      // Limpiar del localStorage los items cuyo producto ya no existe
      const matchedUuids = new Set(matchedProducts.map((p) => p.uuid));
      const validItems = localCart.items.filter((item) =>
        matchedUuids.has(item.productUuid)
      );
      if (validItems.length !== localCart.items.length) {
        localCartService.saveCart({ items: validItems });
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
          typeof item.product.price === "string"
            ? parseFloat(item.product.price)
            : item.product.price;
        return acc + price * item.quantity;
      }, 0);

  const subtotalVES = isAuthenticated
    ? cart?.subtotalVes || null
    : enrichedLocalItems.reduce((acc, item) => {
        if (!item.product.priceVes) return acc;
        const priceVes = parsePrice(item.product.priceVes);
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
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-700/50">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60 bg-gray-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white leading-none">
                {t("title")}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {cartLoading || loadingProducts ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm text-gray-400">Cargando carrito…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="p-6 bg-gray-800/60 rounded-2xl">
                <ShoppingBag className="w-14 h-14 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">
                  {t("empty")}
                </h3>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  {t("emptyDescription")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
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
                  className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  {t("clearCart")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-700/60 bg-gray-800/60 px-5 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">{t("subtotal")}</span>
              <div className="text-right">
                {subtotalVES && subtotalVES > 0 && (
                  <div className="text-lg font-bold text-white">
                    {formatVES(subtotalVES)}
                  </div>
                )}
                <div
                  className={`font-bold ${
                    subtotalVES && subtotalVES > 0
                      ? "text-sm text-gray-400"
                      : "text-lg text-white"
                  }`}
                >
                  {formatUSD(subtotal)}
                </div>
              </div>
            </div>

            {/* Botón checkout */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30"
            >
              {t("checkout")}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors"
            >
              {t("continueShopping")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
