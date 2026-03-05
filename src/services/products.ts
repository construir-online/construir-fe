import { apiClient } from "@/lib/api";
import type { Product, CreateProductDto, UpdateProductDto, PaginatedResponse, ProductStats, ProductImage } from "@/types";

export const productsService = {
  // CRUD Básico
  async getAll(): Promise<Product[]> {
    return apiClient.get<Product[]>("/products");
  },

  async getByUuid(uuid: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${uuid}`);
  },

  async create(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>("/products", data);
  },

  async update(
    uuid: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    return apiClient.patch<Product>(`/products/${uuid}`, data);
  },

  async delete(uuid: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/products/${uuid}`);
  },

  // Admin - Listado y Filtros
  async getPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    published?: boolean;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.published !== undefined) queryParams.append('published', params.published.toString());
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/products/admin/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Product>>(url);
  },

  // Public - Listado paginado (published=true forzado en backend)
  async getPublicPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryUuid?: string;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryUuid) queryParams.append('categoryUuid', params.categoryUuid);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    const url = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Product>>(url);
  },

  // Admin - Estadísticas
  async getStats(): Promise<ProductStats> {
    return apiClient.get<ProductStats>("/products/admin/stats");
  },

  // Admin - Bajo Inventario
  async getLowStock(threshold?: number): Promise<Product[]> {
    const url = threshold
      ? `/products/admin/low-stock?threshold=${threshold}`
      : '/products/admin/low-stock';
    return apiClient.get<Product[]>(url);
  },

  // Búsqueda
  async search(query: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  // Gestión de Inventario
  async updateInventory(
    uuid: string,
    inventory: number,
  ): Promise<Product> {
    return apiClient.patch<Product>(`/products/${uuid}/inventory`, { inventory });
  },

  // Operaciones Masivas
  async bulkPublish(
    uuids: string[],
    published: boolean,
  ): Promise<{ message: string; updated: number }> {
    return apiClient.patch<{ message: string; updated: number }>(
      '/products/bulk/publish',
      { uuids, published },
    );
  },

  async bulkFeature(
    uuids: string[],
    featured: boolean,
  ): Promise<{ message: string; updated: number }> {
    return apiClient.patch<{ message: string; updated: number }>(
      '/products/bulk/feature',
      { uuids, featured },
    );
  },

  // Gestión de Imágenes
  async uploadImage(
    uuid: string,
    file: File,
    isPrimary?: boolean,
    order?: number
  ): Promise<{ message: string; image: ProductImage }> {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (isPrimary !== undefined) queryParams.append('isPrimary', isPrimary.toString());
    if (order !== undefined) queryParams.append('order', order.toString());

    const url = `/products/${uuid}/images${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FormData request
    const response = await apiClient.post<{ message: string; image: ProductImage }>(url, formData);
    return response;
  },

  async deleteImage(
    imageUuid: string,
  ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/products/images/${imageUuid}`);
  },

  async setPrimaryImage(
    imageUuid: string,
  ): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`/products/images/${imageUuid}/primary`, {});
  },
};

// Helper function for public product listing
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryUuid?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<PaginatedResponse<Product>> {
  return productsService.getPublicPaginated(params);
}
