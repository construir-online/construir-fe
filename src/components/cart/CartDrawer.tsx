"use client";

import { useEffect, useState } from "react";
import { X, ShoppingBag, Loader2 } from "lucide-react";
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
    // Siempre permitir ir a checkout (con o sin login)
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
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {t("title")} ({totalItems})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t("title")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartLoading || loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("empty")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("emptyDescription")}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <CartItem
                  key={index}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}

              {/* Botón vaciar carrito */}
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="w-full mt-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t("clearCart")}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer con total y checkout */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{t("subtotal")}:</span>
              <div className="text-right">
                {subtotalVES && subtotalVES > 0 && (
                  <div className="text-lg font-bold text-blue-600">
                    {formatVES(subtotalVES)}
                  </div>
                )}
                <div
                  className={`${
                    subtotalVES && subtotalVES > 0
                      ? "text-sm text-gray-600"
                      : "text-lg font-bold text-blue-600"
                  }`}
                >
                  {formatUSD(subtotal)}
                </div>
              </div>
            </div>

            {/* Botón checkout */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("checkout")}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t("continueShopping")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
