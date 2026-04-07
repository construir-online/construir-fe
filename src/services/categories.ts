import { apiClient } from "@/lib/api";
import type { Category, CategoryStats, CreateCategoryDto, UpdateCategoryDto, AssignParentDto, PaginatedResponse } from "@/types";

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories");
  },

  async searchPaginated(params: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<Category>> {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    qs.set('page', String(params.page ?? 1));
    qs.set('limit', String(params.limit ?? 20));
    return apiClient.get<PaginatedResponse<Category>>(`/categories?${qs}`);
  },

  async getVisible(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories/visible");
  },

  async getFeatured(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories/featured");
  },

  async getParents(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories/parents");
  },

  async getChildren(parentUuid: string): Promise<Category[]> {
    return apiClient.get<Category[]>(`/categories/parent/${parentUuid}/children`);
  },

  async getStats(): Promise<CategoryStats> {
    return apiClient.get<CategoryStats>("/categories/stats");
  },

  async getBySlug(slug: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/slug/${slug}`);
  },

  async getByUuid(uuid: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${uuid}`);
  },

  async create(data: CreateCategoryDto, image?: File): Promise<Category> {
    const formData = new FormData();
    for (const key in data) {
      const value = data[key as keyof CreateCategoryDto];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    if (image) {
      formData.append('image', image);
    }
    return apiClient.post<Category>("/categories", formData);
  },

  async update(
    uuid: string,
    data: UpdateCategoryDto,
    image?: File,
  ): Promise<Category> {
    const formData = new FormData();
    for (const key in data) {
      const value = data[key as keyof UpdateCategoryDto];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    if (image) {
      formData.append('image', image);
    }
    return apiClient.patch<Category>(`/categories/${uuid}`, formData);
  },

  async assignParent(uuid: string, data: AssignParentDto): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${uuid}/parent`, data);
  },

  async delete(uuid: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/categories/${uuid}`);
  },

  async uploadImage(uuid: string, image: File): Promise<Category> {
    const formData = new FormData();
    formData.append('image', image);
    return apiClient.post<Category>(`/categories/${uuid}/image`, formData);
  },

  async deleteImage(uuid: string, confirm?: boolean): Promise<{
    message: string;
    requiresConfirmation?: boolean;
    category?: Category;
  }> {
    const url = confirm
      ? `/categories/${uuid}/image?confirm=true`
      : `/categories/${uuid}/image`;
    return apiClient.delete<{
      message: string;
      requiresConfirmation?: boolean;
      category?: Category;
    }>(url);
  },
};