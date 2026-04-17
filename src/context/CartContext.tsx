"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { cartService, localCartService } from "@/services/cart";
import type { Cart, LocalCart } from "@/types";

interface CartContextType {
  // Estado
  cart: Cart | null;
  localCart: LocalCart;
  loading: boolean;
  error: string | null;
  isCartOpen: boolean;

  // Métodos
  addToCart: (productUuid: string, quantity: number) => Promise<void>;
  updateQuantity: (productUuid: string, quantity: number) => Promise<void>;
  removeFromCart: (productUuid: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;

  // Utilidades
  getTotalItems: () => number;
  getItemQuantity: (productUuid: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localCart, setLocalCart] = useState<LocalCart>({ items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Cargar carrito local al montar el componente
  useEffect(() => {
    // Siempre cargar el carrito local en el cliente al iniciar
    if (typeof window !== 'undefined') {
      const stored = localCartService.getCart();
      setLocalCart(stored);
    }
  }, []);

  // Cargar carrito del servidor cuando el usuario esté autenticado
  useEffect(() => {
    if (token && user) {
      loadServerCart();
    } else {
      setCart(null);
    }
  }, [token, user]);

  // Sincronizar carrito local con el servidor después del login
  const syncCartAfterLogin = useCallback(async () => {
    if (!token || !localCartService.hasItems()) return;

    try {
      setLoading(true);
      const syncedCart = await cartService.syncLocalCart();
      setCart(syncedCart);
      setLocalCart({ items: [] });
    } catch (err) {
      console.error("Error syncing cart after login:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Ejecutar sincronización cuando el usuario se loguee
  useEffect(() => {
    if (token && user && localCartService.hasItems()) {
      syncCartAfterLogin();
    }
  }, [token, user, syncCartAfterLogin]);

  /**
   * Carga el carrito desde el servidor
   */
  const loadServerCart = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const serverCart = await cartService.getCart();
      setCart(serverCart);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error loading cart";
      setError(message);
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Agrega un producto al carrito
   */
  const addToCart = async (productUuid: string, quantity: number) => {
    try {
      if (token) {
        const updatedCart = await cartService.addItem({ productUuid, quantity });
        setCart(updatedCart);
      } else {
        const updatedLocalCart = localCartService.addItem(productUuid, quantity);
        setLocalCart(updatedLocalCart);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding item to cart";
      setError(message);
      throw err;
    }
  };

  /**
   * Actualiza la cantidad de un producto
   */
  const updateQuantity = async (productUuid: string, quantity: number) => {
    try {
      if (token) {
        const itemUuid = cart?.items.find(i => i.product.uuid === productUuid)?.uuid;
        if (!itemUuid) throw new Error("Item not found in cart");
        const updatedCart = await cartService.updateItem(itemUuid, { quantity });
        setCart(updatedCart);
      } else {
        const updatedLocalCart = localCartService.updateItem(productUuid, quantity);
        setLocalCart(updatedLocalCart);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error updating quantity";
      setError(message);
      throw err;
    }
  };

  /**
   * Elimina un producto del carrito
   */
  const removeFromCart = async (productUuid: string) => {
    try {
      if (token) {
        const itemUuid = cart?.items.find(i => i.product.uuid === productUuid)?.uuid;
        if (!itemUuid) throw new Error("Item not found in cart");
        const updatedCart = await cartService.removeItem(itemUuid);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = localCartService.removeItem(productUuid);
        setLocalCart(updatedLocalCart);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error removing item";
      setError(message);
      throw err;
    }
  };

  /**
   * Vacía el carrito completamente
   */
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);

      if (token) {
        // Usuario autenticado
        const updatedCart = await cartService.clearCart();
        setCart(updatedCart);
      } else {
        // Usuario no autenticado
        localCartService.clearCart();
        setLocalCart({ items: [] });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error clearing cart";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recarga el carrito desde el servidor
   */
  const refreshCart = async () => {
    if (token) {
      await loadServerCart();
    } else {
      const stored = localCartService.getCart();
      setLocalCart(stored);
    }
  };

  /**
   * Obtiene el número total de items en el carrito
   */
  const getTotalItems = useCallback(() => {
    if (token && cart) {
      return (cart.items ?? []).reduce((total, item) => total + item.quantity, 0);
    }
    return (localCart.items ?? []).reduce((total, item) => total + item.quantity, 0);
  }, [token, cart, localCart]);

  /**
   * Obtiene la cantidad de un producto específico en el carrito
   */
  const getItemQuantity = useCallback((productUuid: string): number => {
    if (token && cart) {
      const item = (cart.items ?? []).find((item) => item.product.uuid === productUuid);
      return item?.quantity || 0;
    }

    const item = localCart.items.find((item) => item.productUuid === productUuid);
    return item?.quantity || 0;
  }, [token, cart, localCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        localCart,
        loading,
        error,
        isCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        openCart,
        closeCart,
        getTotalItems,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
