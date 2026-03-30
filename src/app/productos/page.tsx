"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { productsService } from "@/services/products";
import type { Product } from "@/types";
import { CategoryMenu } from "@/components/CategoryMenu";
import ProductCard from "@/components/product/ProductCard";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('categoria');
  const searchParam = searchParams.get('search');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState(searchParam || "");

  // Sincronizar con el parámetro de URL (navegación desde navbar)
  const prevSearchParam = useRef(searchParam);
  useEffect(() => {
    if (searchParam !== prevSearchParam.current) {
      prevSearchParam.current = searchParam;
      setSearch(searchParam || '');
      setPage(1);
    }
  }, [searchParam]);

  useEffect(() => {
    loadProducts();
  }, [page, categoryParam, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsService.getPublicPaginated({
        page,
        limit: 12,
        categoryUuid: categoryParam || undefined,
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      setProducts(response.data);
      setLastPage(response.lastPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Category Menu */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <CategoryMenu />
          </aside>

          {/* Products Section */}
          <div className="flex-1">
            {categoryParam && (
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 capitalize">
                {categoryParam}
              </h2>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Cargando productos...</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No hay productos disponibles</p>
                {(categoryParam || search) && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    Intenta ajustar tus filtros de búsqueda
                  </p>
                )}
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 mb-8">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.uuid}
                      product={product}
                      variant="default"
                      showAddToCart={true}
                      showBadges={true}
                      showDescription={true}
                      showStock={true}
                      priority={index < 6}
                    />
                  ))}
                </div>

                {/* Paginación */}
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-700 dark:text-gray-300">
                    Página {page} de {lastPage}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === lastPage}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
