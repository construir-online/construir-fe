import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Product } from '@/types';

/**
 * El IVA y los precios con IVA del producto llegan como texto.
 *
 * `price` y `priceVes` sí estaban bien declarados `string`; `iva`,
 * `priceWithIva`, `ivaVes` y `priceWithIvaVes` son igual de `numeric` y llegan
 * igual de cadena, pero el tipo los declara `number`.
 *
 * Hoy no rompe nada porque los consumidores multiplican
 * (`priceWithIva * cantidad`) y `*` coacciona. Estas pruebas fijan el tipo, que
 * es lo que falla en cuanto alguien SUMA dos de estos campos.
 *
 * Los datos son la respuesta literal de `GET /products` del backend real.
 */

const get = vi.fn();
vi.mock('@/lib/api', () => ({
  apiClient: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { productsService } = await import('../products');

const PRODUCTO_CRUDO = {
  uuid: '8df3c796-3e06-4217-ad90-d7c2f00a443b',
  name: 'PINT ESMALTE BRILL CAFE 1/4G ARADOS VERONA',
  sku: '30656',
  inventory: 2,
  price: '9.00',
  priceVes: '4330.96',
  iva: '1.44',
  priceWithIva: '10.44',
  ivaVes: '692.95',
  priceWithIvaVes: '5023.91',
  published: true,
  featured: true,
  createdAt: '2025-10-24T04:47:21.913Z',
  updatedAt: '2026-09-10T14:30:04.128Z',
  deletedAt: null,
} as unknown as Product;

describe('productsService: el IVA del producto llega como texto', () => {
  beforeEach(() => get.mockReset());

  it('convierte a número el IVA y los precios con IVA', async () => {
    get.mockResolvedValue(PRODUCTO_CRUDO);

    const producto = await productsService.getByUuid('8df3c796');

    expect(producto.iva).toBe(1.44);
    expect(producto.priceWithIva).toBe(10.44);
    expect(producto.ivaVes).toBe(692.95);
    expect(producto.priceWithIvaVes).toBe(5023.91);

    expect(typeof producto.priceWithIva).toBe('number');
    expect(typeof producto.priceWithIvaVes).toBe('number');
  });

  /**
   * `price` y `priceVes` se declaran `string` y llegan `string`: ahí el
   * contrato es honesto y no hay que tocarlo. Fijarlo evita que un arreglo
   * futuro los "normalice" también y rompa a `parsePrice`, que ya los espera
   * como texto.
   */
  it('deja `price` y `priceVes` como texto, que es lo que declaran', async () => {
    get.mockResolvedValue(PRODUCTO_CRUDO);

    const producto = await productsService.getByUuid('8df3c796');

    expect(producto.price).toBe('9.00');
    expect(producto.priceVes).toBe('4330.96');
  });

  it('normaliza cada producto del listado paginado', async () => {
    get.mockResolvedValue({
      data: [PRODUCTO_CRUDO],
      total: 1089,
      page: 1,
      lastPage: 109,
    });

    const pagina = await productsService.getPublicPaginated({ page: 1 });

    expect(pagina.data[0].priceWithIva).toBe(10.44);
    // La envoltura de paginación se conserva intacta.
    expect(pagina.total).toBe(1089);
    expect(pagina.lastPage).toBe(109);
  });

  /**
   * La operación que delata la mentira. Con cadenas, sumar dos líneas del
   * carrito da `"10.44" + "9.28" === "10.449.28"` — y TypeScript no dice nada
   * porque cree que son `number`.
   */
  it('permite sumar dos precios sin que se concatenen', async () => {
    get.mockResolvedValue([
      PRODUCTO_CRUDO,
      { ...PRODUCTO_CRUDO, uuid: 'otro', priceWithIva: '9.28' },
    ]);

    const [uno, dos] = await productsService.getAll();

    expect(uno.priceWithIva + dos.priceWithIva).toBe(19.72);
  });
});
