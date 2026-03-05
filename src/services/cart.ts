import { apiClient } from '@/lib/api';
import type {
  Cart,
  LocalCart,
  LocalCartItem,
  AddToCartDto,
  UpdateCartItemDto,
  Product,
} from '@/types';
import { parsePrice } from '@/lib/currency';

const CART_STORAGE_KEY = 'cart';

// ============================================
// LocalStorage Cart Functions (Sin autenticación)
// ============================================

export const localCartService = {
  /**
   * Obtiene el carrito desde localStorage
   */
  getCart(): LocalCart {
    if (typeof window === 'undefined') return { items: [] };
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return { items: [] };
      const cart: LocalCart = JSON.parse(raw);
      const sanitized: LocalCart = {
        items: (cart.items ?? []).filter(
          (item) =>
            typeof item.productUuid === 'string' &&
            item.productUuid.trim() !== '' &&
            typeof item.quantity === 'number' &&
            item.quantity >= 1,
        ),
      };
      if (sanitized.items.length !== (cart.items ?? []).length) {
        this.saveCart(sanitized);
      }
      return sanitized;
    } catch {
      return { items: [] };
    }
  },

  /**
   * Guarda el carrito en localStorage
   */
  saveCart(cart: LocalCart): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  },

  /**
   * Agrega un producto al carrito local
   */
  addItem(productUuid: string, quantity: number): LocalCart {
    const cart = this.getCart();
    const existingItem = cart.items.find((item) => item.productUuid === productUuid);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productUuid, quantity });
    }

    this.saveCart(cart);
    return cart;
  },

  /**
   * Actualiza la cantidad de un producto
   */
  updateItem(productUuid: string, quantity: number): LocalCart {
    const cart = this.getCart();
    const item = cart.items.find((item) => item.productUuid === productUuid);

    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);
    }

    return cart;
  },

  /**
   * Elimina un producto del carrito
   */
  removeItem(productUuid: string): LocalCart {
    const cart = this.getCart();
    cart.items = cart.items.filter((item) => item.productUuid !== productUuid);
    this.saveCart(cart);
    return cart;
  },

  /**
   * Vacía el carrito local
   */
  clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  /**
   * Obtiene el número total de items
   */
  getTotalItems(): number {
    const cart = this.getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  },

  /**
   * Verifica si el carrito tiene items
   */
  hasItems(): boolean {
    return this.getTotalItems() > 0;
  },
};

// ============================================
// API Cart Functions (Con autenticación)
// ============================================

export const cartService = {
  /**
   * Obtiene el carrito del usuario autenticado desde el backend
   */
  async getCart(): Promise<Cart> {
    return apiClient.get<Cart>('/cart');
  },

  /**
   * Agrega un producto al carrito del backend
   */
  async addItem(data: AddToCartDto): Promise<Cart> {
    return apiClient.post<Cart>('/cart/items', data);
  },

  /**
   * Actualiza la cantidad de un item en el carrito
   */
  async updateItem(itemUuid: string, data: UpdateCartItemDto): Promise<Cart> {
    return apiClient.patch<Cart>(`/cart/items/${itemUuid}`, data);
  },

  /**
   * Elimina un item del carrito
   */
  async removeItem(itemUuid: string): Promise<Cart> {
    return apiClient.delete<Cart>(`/cart/items/${itemUuid}`);
  },

  /**
   * Vacía todo el carrito
   */
  async clearCart(): Promise<Cart> {
    return apiClient.delete<Cart>('/cart');
  },

  /**
   * Sincroniza los precios del carrito con los precios actuales
   */
  async syncPrices(): Promise<Cart> {
    return apiClient.post<Cart>('/cart/sync-prices');
  },

  /**
   * Sincroniza el carrito local con el backend después del login
   * Envía todos los items del localStorage al servidor
   */
  async syncLocalCart(): Promise<Cart> {
    const localCart = localCartService.getCart();

    // Si no hay items locales, solo obtener el carrito del servidor
    if (!localCart.items.length) {
      return this.getCart();
    }

    // Agregar cada item local al carrito del servidor
    for (const item of localCart.items) {
      try {
        await this.addItem({
          productUuid: item.productUuid,
          quantity: item.quantity,
        });
      } catch (error) {
        console.error(`Error syncing item ${item.productUuid}:`, error);
        // Continuar con los demás items aunque uno falle
      }
    }

    // Limpiar el carrito local después de sincronizar
    localCartService.clearCart();

    // Retornar el carrito actualizado del servidor
    return this.getCart();
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Calcula el total de items con información de productos
 */
export function calculateCartTotals(items: LocalCartItem[], products: Product[]) {
  let subtotal = 0;
  let subtotalVes = 0;
  let totalItems = 0;

  const enrichedItems = items.map((item) => {
    const product = products.find((p) => p.uuid === item.productUuid);
    if (!product) return null;

    const price = parseFloat(product.price);
    const itemSubtotal = price * item.quantity;

    subtotal += itemSubtotal;
    totalItems += item.quantity;

    // Calcular subtotal VES si existe el precio en VES
    if (product.priceVes) {
      const priceVes = parsePrice(product.priceVes);
      subtotalVes += priceVes * item.quantity;
    }

    return {
      ...item,
      product,
      price: product.price,
      priceVes: product.priceVes,
      subtotal: itemSubtotal,
      subtotalVes: product.priceVes ? parsePrice(product.priceVes) * item.quantity : null,
    };
  }).filter(Boolean);

  return {
    items: enrichedItems,
    totalItems,
    subtotal,
    subtotalVes: subtotalVes > 0 ? subtotalVes : null,
  };
}
