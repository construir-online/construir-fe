import { apiClient } from "@/lib/api";
import { aNumero, avisarSiDiverge } from "@/lib/api-normalizacion";
import type { Product, CreateProductDto, UpdateProductDto, PaginatedResponse, ProductStats, ProductImage } from "@/types";

/**
 * El IVA y los precios con IVA llegan como texto, aunque `Product` los declare
 * `number`.
 *
 * `price` y `priceVes` sí estaban bien declarados como `string` — alguien se dio
 * cuenta con esos dos y no con los otros cuatro. `iva`, `priceWithIva`, `ivaVes`
 * y `priceWithIvaVes` son igual de `numeric` y llegan igual de cadena
 * (`"10.44"`, `"5023.91"`).
 *
 * Hoy no se ve el fallo porque todos los consumidores que quedan multiplican
 * (`priceWithIva * cantidad`) o restan, y `*` y `-` coaccionan la cadena a
 * número antes de operar; los que muestran el precio suelto pasan por
 * `parsePrice`. Es decir: funciona por la precedencia de operadores. El día que
 * alguien escriba una SUMA de dos de estos campos —un total de línea más otro—
 * obtendrá `"10.44" + "9.28" === "10.449.28"` sin que TypeScript diga nada.
 *
 * Se normaliza acá para que el `number` prometido sea de verdad un `number`.
 * Se exporta porque el producto viene ANIDADO dentro del carrito y de los
 * renglones del pedido, y allí arrastra la misma mentira.
 */
export function normalizarProducto(crudo: Product): Product {
  avisarSiDiverge("GET /products", crudo, {
    priceWithIva: "number",
    iva: "number",
    inventory: "number",
  });

  return {
    ...crudo,
    inventory: aNumero(crudo.inventory),
    iva: aNumero(crudo.iva),
    priceWithIva: aNumero(crudo.priceWithIva),
    ivaVes: aNumero(crudo.ivaVes),
    priceWithIvaVes: aNumero(crudo.priceWithIvaVes),
  };
}

/** Normaliza cada producto de una respuesta paginada, dejando la envoltura. */
function normalizarPagina(
  pagina: PaginatedResponse<Product>,
): PaginatedResponse<Product> {
  return { ...pagina, data: (pagina.data ?? []).map(normalizarProducto) };
}

export const productsService = {
  // CRUD Básico
  async getAll(): Promise<Product[]> {
    const crudo = await apiClient.get<Product[]>("/products");
    return crudo.map(normalizarProducto);
  },

  async getByUuid(uuid: string): Promise<Product> {
    return normalizarProducto(await apiClient.get<Product>(`/products/${uuid}`));
  },

  async create(data: CreateProductDto): Promise<Product> {
    return normalizarProducto(await apiClient.post<Product>("/products", data));
  },

  async update(
    uuid: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    return normalizarProducto(
      await apiClient.patch<Product>(`/products/${uuid}`, data),
    );
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
    return normalizarPagina(await apiClient.get<PaginatedResponse<Product>>(url));
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
    /** Precio mínimo en USD con IVA. */
    minPrice?: number;
    /** Precio máximo en USD con IVA. */
    maxPrice?: number;
    /** Unidades mínimas en inventario. */
    minInventory?: number;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryUuid) queryParams.append('categoryUuid', params.categoryUuid);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    // `!== undefined` y no un truthy: un `minPrice: 0` es un filtro puesto en
    // cero, no un filtro ausente, y con `if (params?.minPrice)` se caería en
    // silencio dejando el parámetro en la URL sin llegar nunca al backend.
    if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minInventory !== undefined) queryParams.append('minInventory', params.minInventory.toString());
    const url = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return normalizarPagina(await apiClient.get<PaginatedResponse<Product>>(url));
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
    return (await apiClient.get<Product[]>(url)).map(normalizarProducto);
  },

  // Búsqueda
  async search(query: string): Promise<Product[]> {
    return (
      await apiClient.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`)
    ).map(normalizarProducto);
  },

  // Gestión de Inventario
  async updateInventory(
    uuid: string,
    inventory: number,
  ): Promise<Product> {
    return normalizarProducto(
      await apiClient.patch<Product>(`/products/${uuid}/inventory`, { inventory }),
    );
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

/**
 * Resuelve los productos de un carrito a partir de sus uuid.
 *
 * El carrito local sólo guarda uuid y cantidad, así que hay que ir a buscar
 * cada producto para mostrar precios. Se resuelve **uno por uuid** y no
 * pidiendo una página del catálogo: con `getProducts({ page: 1, limit: 100 })`
 * todo producto que no estuviera entre los 100 más recientes se trataba como
 * inexistente — con 1089 productos publicados, el 91% del catálogo.
 *
 * `gone` sólo lista los que respondieron **404**. Un fallo de red o un 500 no
 * dicen nada sobre el catálogo: esos uuid no aparecen ni en `found` ni en
 * `gone`, y quien llame decide reintentar sin haber perdido nada.
 */
export async function resolveCartProducts(
  uuids: string[],
): Promise<{ found: Product[]; gone: string[] }> {
  const results = await Promise.allSettled(
    uuids.map((uuid) => productsService.getByUuid(uuid)),
  );

  const found: Product[] = [];
  const gone: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      found.push(result.value);
    } else if (
      (result.reason as { statusCode?: number } | null)?.statusCode === 404
    ) {
      gone.push(uuids[index]);
    } else {
      console.error(`Error resolviendo el producto ${uuids[index]}:`, result.reason);
    }
  });

  return { found, gone };
}
