import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriesService } from '../categories';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';

const mockCategory = {
  uuid: 'cat-1',
  name: 'Herramientas',
  slug: 'herramientas',
  visible: true,
  isFeatured: false,
  order: 0,
};

const paginatedResponse = {
  data: [mockCategory],
  total: 1,
  page: 1,
  lastPage: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('categoriesService.searchPaginated', () => {
  it('construye el query string con search, page y limit', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(paginatedResponse);

    await categoriesService.searchPaginated({ search: 'mano', page: 2, limit: 10 });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('search=mano'),
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
    );
  });

  it('usa defaults page=1 y limit=20 cuando no se pasan params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(paginatedResponse);

    await categoriesService.searchPaginated();

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('limit=20'),
    );
  });

  it('no incluye search en el query cuando no se proporciona', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(paginatedResponse);

    await categoriesService.searchPaginated({ page: 1 });

    expect(apiClient.get).not.toHaveBeenCalledWith(
      expect.stringContaining('search='),
    );
  });
});

describe('categoriesService.create', () => {
  it('siempre envía FormData (incluso sin imagen)', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockCategory);

    await categoriesService.create({ name: 'Mano', slug: 'mano', visible: true, isFeatured: false });

    const [, body] = vi.mocked(apiClient.post).mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
  });

  it('incluye el archivo imagen en el FormData cuando se proporciona', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockCategory);

    const file = new File(['img'], 'foto.png', { type: 'image/png' });
    await categoriesService.create({ name: 'Mano', slug: 'mano', visible: true, isFeatured: false }, file);

    const [, body] = vi.mocked(apiClient.post).mock.calls[0];
    expect((body as FormData).get('image')).toBe(file);
  });
});

describe('categoriesService.update', () => {
  it('envía FormData con los datos de actualización', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockCategory);

    await categoriesService.update('cat-1', { visible: false });

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('visible')).toBe('false');
  });

  it('incluye imagen en FormData cuando se provee', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockCategory);

    const file = new File(['img'], 'nueva.png', { type: 'image/png' });
    await categoriesService.update('cat-1', { visible: true }, file);

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0];
    expect((body as FormData).get('image')).toBe(file);
  });
});

describe('categoriesService.delete', () => {
  it('llama al endpoint correcto con el UUID', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ message: 'Deleted' });

    await categoriesService.delete('cat-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
  });
});

describe('categoriesService.assignParent', () => {
  it('envía PATCH al endpoint de parent con el parentUuid', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(mockCategory);

    await categoriesService.assignParent('cat-child', { parentUuid: 'cat-parent' });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/categories/cat-child/parent',
      { parentUuid: 'cat-parent' },
    );
  });
});
