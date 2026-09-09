import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/services/products', () => ({
  resolveCartProducts: vi.fn(),
}));

vi.mock('@/services/cart', () => ({
  localCartService: { saveCart: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/context/CartContext', () => ({ useCart: vi.fn() }));

import { useCartTotals } from '../useCartTotals';
import { resolveCartProducts } from '@/services/products';
import { localCartService } from '@/services/cart';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';

const SIDERURGICO_UUID = 'd12d530e-7568-4006-823d-4da2877bec33';

function makeProduct(uuid: string): Product {
  return {
    uuid,
    name: 'ANGULO H.NEGRO 50X50X4MM X6MT',
    sku: '10943',
    inventory: 30,
    price: '32.00',
    priceWithIva: 37.12,
    priceVes: '15398.97',
    priceWithIvaVes: 17862.81,
    published: true,
  } as unknown as Product;
}

const refreshCart = vi.fn();

function mockCart(items: { productUuid: string; quantity: number }[]) {
  vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>);
  vi.mocked(useCart).mockReturnValue({
    cart: null,
    localCart: { items },
    loading: false,
    refreshCart,
    getTotalItems: () => items.reduce((acc, i) => acc + i.quantity, 0),
  } as unknown as ReturnType<typeof useCart>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * La clasificación entre "ya no existe" y "falló la petición" vive en
 * `resolveCartProducts` y tiene sus propias pruebas. Acá se verifica el
 * cableado: qué hace el hook con lo que ese resolutor le devuelve.
 */
describe('useCartTotals — resolución del carrito del invitado', () => {
  it('enriquece los ítems con los productos resueltos y no purga nada', async () => {
    mockCart([{ productUuid: SIDERURGICO_UUID, quantity: 1 }]);
    vi.mocked(resolveCartProducts).mockResolvedValue({
      found: [makeProduct(SIDERURGICO_UUID)],
      gone: [],
    });

    const { result } = renderHook(() => useCartTotals());

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    expect(resolveCartProducts).toHaveBeenCalledWith([SIDERURGICO_UUID]);
    expect(localCartService.saveCart).not.toHaveBeenCalled();
    expect(result.current.subtotal).toBe(37.12);
  });

  it('purga del carrito los uuid que el resolutor marcó como inexistentes', async () => {
    mockCart([{ productUuid: 'borrado', quantity: 1 }]);
    vi.mocked(resolveCartProducts).mockResolvedValue({ found: [], gone: ['borrado'] });

    renderHook(() => useCartTotals());

    await waitFor(() =>
      expect(localCartService.saveCart).toHaveBeenCalledWith({ items: [] }),
    );
    expect(refreshCart).toHaveBeenCalled();
  });

  it('no purga nada cuando el resolutor no descartó ninguno', async () => {
    mockCart([{ productUuid: SIDERURGICO_UUID, quantity: 1 }]);
    // Es lo que devuelve ante un fallo de red: ni encontrado ni descartado.
    vi.mocked(resolveCartProducts).mockResolvedValue({ found: [], gone: [] });

    renderHook(() => useCartTotals());

    await waitFor(() => expect(resolveCartProducts).toHaveBeenCalled());

    expect(localCartService.saveCart).not.toHaveBeenCalled();
    expect(refreshCart).not.toHaveBeenCalled();
  });

  it('conserva los ítems vivos y purga sólo el que ya no existe', async () => {
    mockCart([
      { productUuid: SIDERURGICO_UUID, quantity: 2 },
      { productUuid: 'borrado', quantity: 1 },
    ]);
    vi.mocked(resolveCartProducts).mockResolvedValue({
      found: [makeProduct(SIDERURGICO_UUID)],
      gone: ['borrado'],
    });

    renderHook(() => useCartTotals());

    await waitFor(() =>
      expect(localCartService.saveCart).toHaveBeenCalledWith({
        items: [{ productUuid: SIDERURGICO_UUID, quantity: 2 }],
      }),
    );
  });
});
