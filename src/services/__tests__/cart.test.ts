import { describe, it, expect, beforeEach } from 'vitest';
import { localCartService, calculateCartTotals } from '../cart';
import type { Product, LocalCartItem } from '@/types';

// localCartService usa localStorage — jsdom lo provee en el entorno de test

beforeEach(() => {
  localStorage.clear();
});

describe('localCartService.addItem', () => {
  it('agrega un nuevo item al carrito vacío', () => {
    const cart = localCartService.addItem('prod-1', 2);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({ productUuid: 'prod-1', quantity: 2 });
  });

  it('incrementa la cantidad si el producto ya existe', () => {
    localCartService.addItem('prod-1', 2);
    const cart = localCartService.addItem('prod-1', 3);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
  });

  it('agrega un item distinto sin afectar los existentes', () => {
    localCartService.addItem('prod-1', 1);
    const cart = localCartService.addItem('prod-2', 4);

    expect(cart.items).toHaveLength(2);
  });
});

describe('localCartService.removeItem', () => {
  it('elimina el item del carrito', () => {
    localCartService.addItem('prod-1', 1);
    localCartService.addItem('prod-2', 2);
    const cart = localCartService.removeItem('prod-1');

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productUuid).toBe('prod-2');
  });

  it('no falla si el producto no existe en el carrito', () => {
    localCartService.addItem('prod-1', 1);
    const cart = localCartService.removeItem('prod-inexistente');

    expect(cart.items).toHaveLength(1);
  });
});

describe('localCartService.clearCart', () => {
  it('vacía el carrito y elimina la clave de localStorage', () => {
    localCartService.addItem('prod-1', 1);
    localCartService.clearCart();

    expect(localStorage.getItem('cart')).toBeNull();
    expect(localCartService.getCart().items).toHaveLength(0);
  });
});

describe('localCartService.getTotalItems', () => {
  it('retorna 0 cuando el carrito está vacío', () => {
    expect(localCartService.getTotalItems()).toBe(0);
  });

  it('retorna la suma de todas las cantidades', () => {
    localCartService.addItem('prod-1', 3);
    localCartService.addItem('prod-2', 2);

    expect(localCartService.getTotalItems()).toBe(5);
  });
});

describe('calculateCartTotals', () => {
  const products: Partial<Product>[] = [
    { uuid: 'prod-1', name: 'Martillo', price: '10.00', priceVes: '405.00' },
    { uuid: 'prod-2', name: 'Destornillador', price: '5.50', priceVes: undefined },
  ];

  const items: LocalCartItem[] = [
    { productUuid: 'prod-1', quantity: 2 },
    { productUuid: 'prod-2', quantity: 1 },
  ];

  it('calcula el subtotal en USD correctamente', () => {
    const result = calculateCartTotals(items, products as Product[]);

    // prod-1: 10.00 * 2 = 20.00, prod-2: 5.50 * 1 = 5.50 → total = 25.50
    expect(result.subtotal).toBeCloseTo(25.5);
  });

  it('calcula el total de items correctamente', () => {
    const result = calculateCartTotals(items, products as Product[]);

    expect(result.totalItems).toBe(3);
  });

  it('calcula subtotalVes solo para productos que tienen precio VES', () => {
    const result = calculateCartTotals(items, products as Product[]);

    // prod-1: 405.00 * 2 = 810, prod-2 no tiene VES
    expect(result.subtotalVes).toBeCloseTo(810);
  });

  it('retorna subtotalVes null cuando ningún producto tiene precio VES', () => {
    const itemsOnly2: LocalCartItem[] = [{ productUuid: 'prod-2', quantity: 1 }];
    const result = calculateCartTotals(itemsOnly2, products as Product[]);

    expect(result.subtotalVes).toBeNull();
  });

  it('ignora items cuyo producto no existe en el catálogo', () => {
    const itemsWithUnknown: LocalCartItem[] = [
      { productUuid: 'prod-inexistente', quantity: 5 },
      { productUuid: 'prod-1', quantity: 1 },
    ];
    const result = calculateCartTotals(itemsWithUnknown, products as Product[]);

    expect(result.items).toHaveLength(1);
    expect(result.subtotal).toBeCloseTo(10.0);
  });

  it('retorna valores en cero para un carrito vacío', () => {
    const result = calculateCartTotals([], products as Product[]);

    expect(result.subtotal).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
