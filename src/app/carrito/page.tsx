'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getProducts } from '@/services/products';
import { localCartService } from '@/services/cart';
import CartItem from '@/components/cart/CartItem';
import type { Product } from '@/types';
import { formatVES, formatUSD, parsePrice } from '@/lib/currency';

export default function CarritoPage() {
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

  useEffect(() => {
    if (isAuthenticated || localCart.items.length === 0) return;

    const cartUuids = localCart.items.map((item) => item.productUuid);
    const loadedUuids = new Set(products.map((p) => p.uuid));
    const needsLoading = cartUuids.some((uuid) => !loadedUuids.has(uuid));

    if (needsLoading) {
      loadLocalCartProducts();
    }
  }, [isAuthenticated, localCart.items]);

  const loadLocalCartProducts = async () => {
    try {
      setLoadingProducts(true);
      const productUuids = localCart.items.map((item) => item.productUuid);
      const response = await getProducts({ page: 1, limit: 100 });
      const matchedProducts = response.data.filter((p) =>
        productUuids.includes(p.uuid)
      );
      setProducts(matchedProducts);

      const matchedUuids = new Set(matchedProducts.map((p) => p.uuid));
      const validItems = localCart.items.filter((item) =>
        matchedUuids.has(item.productUuid)
      );
      if (validItems.length !== localCart.items.length) {
        localCartService.saveCart({ items: validItems });
        await refreshCart();
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const enrichedLocalItems = localCart.items
    .map((item) => {
      const product = products.find((p) => p.uuid === item.productUuid);
      if (!product) return null;
      return { productUuid: item.productUuid, quantity: item.quantity, product };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const items = isAuthenticated ? cart?.items || [] : enrichedLocalItems;

  const subtotal = isAuthenticated
    ? cart?.subtotal || 0
    : enrichedLocalItems.reduce((acc, item) => {
        return acc + item.product.priceWithIva * item.quantity;
      }, 0);

  const subtotalVES = isAuthenticated
    ? cart?.subtotalVes || null
    : enrichedLocalItems.reduce((acc, item) => {
        return acc + item.product.priceWithIvaVes * item.quantity;
      }, 0);

  const handleClearCart = async () => {
    if (confirm('¿Vaciar el carrito? Esta acción no se puede deshacer.')) {
      await clearCart();
    }
  };

  const isLoading = cartLoading || loadingProducts;

  return (
    <div className="px-3 py-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 px-1">
        Carrito
      </h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-4">
        {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando carrito…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="p-6 bg-gray-100 dark:bg-gray-800/60 rounded-2xl">
            <ShoppingBag className="w-14 h-14 text-gray-400 dark:text-gray-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Tu carrito está vacío
            </h3>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Agrega productos para comenzar tu pedido
            </p>
          </div>
          <Link
            href="/productos"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            Ir a productos
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
            {items.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            <div className="pt-3 pb-1">
              <button
                onClick={handleClearCart}
                className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</span>
              <div className="text-right">
                {subtotalVES && subtotalVES > 0 && (
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatVES(subtotalVES)}
                  </div>
                )}
                <div
                  className={`font-bold ${
                    subtotalVES && subtotalVES > 0
                      ? 'text-sm text-gray-500 dark:text-gray-400'
                      : 'text-lg text-gray-900 dark:text-white'
                  }`}
                >
                  {formatUSD(subtotal)}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30"
            >
              Proceder al pago
            </button>

            <Link
              href="/productos"
              className="block w-full py-2.5 text-sm text-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
