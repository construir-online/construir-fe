import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '../products';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';

const mockProduct = { uuid: 'prod-1', name: 'Martillo', sku: 'MART-01', price: '10.00', inventory: 5 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('productsService.bulkPublish', () => {
  it('envía el array de UUIDs y el flag published al endpoint correcto', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ message: 'OK', updated: 2 });

    await productsService.bulkPublish(['prod-1', 'prod-2'], true);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/products/bulk/publish',
      { uuids: ['prod-1', 'prod-2'], published: true },
    );
  });

  it('puede marcar como no publicados (published: false)', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ message: 'OK', updated: 1 });

    await productsService.bulkPublish(['prod-1'], false);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/products/bulk/publish',
      { uuids: ['prod-1'], published: false },
    );
  });
});

describe('productsService.bulkFeature', () => {
  it('envía el array de UUIDs y el flag featured al endpoint correcto', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ message: 'OK', updated: 1 });

    await productsService.bulkFeature(['prod-1'], true);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/products/bulk/feature',
      { uuids: ['prod-1'], featured: true },
    );
  });
});

describe('productsService.update', () => {
  it('envía los datos al endpoint correcto', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockProduct);

    await productsService.update('prod-1', { name: 'Martillo Grande' });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/products/prod-1',
      { name: 'Martillo Grande' },
    );
  });
});

describe('productsService.getPaginated', () => {
  it('construye el query string con todos los filtros opcionales', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [], total: 0, page: 1, lastPage: 1 });

    await productsService.getPaginated({
      page: 2,
      limit: 10,
      search: 'clavo',
      published: true,
      featured: false,
      sortBy: 'name',
      sortOrder: 'ASC',
    });

    const [url] = vi.mocked(apiClient.get).mock.calls[0];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
    expect(url).toContain('search=clavo');
    expect(url).toContain('published=true');
    expect(url).toContain('sortBy=name');
  });

  it('llama al endpoint sin query string cuando no hay params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [], total: 0, page: 1, lastPage: 1 });

    await productsService.getPaginated();

    expect(apiClient.get).toHaveBeenCalledWith('/products/admin/paginated');
  });
});

describe('productsService.delete', () => {
  it('llama al endpoint DELETE con el UUID correcto', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ message: 'Deleted' });

    await productsService.delete('prod-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/products/prod-1');
  });
});
