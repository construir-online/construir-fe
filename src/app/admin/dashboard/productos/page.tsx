'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';
import type { Product, PaginatedResponse, Category } from '@/types';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryUuid, setCategoryUuid] = useState('');
  const [published, setPublished] = useState<boolean | undefined>(undefined);
  const [featured, setFeatured] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, search, categoryUuid, published, featured, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Product> = await productsService.getPaginated({
        page,
        limit: 10,
        search: search || undefined,
        published,
        featured,
        sortBy,
        sortOrder,
      });

      setProducts(response.data);
      setTotal(response.total);
      setLastPage(response.lastPage);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productsService.delete(uuid);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleBulkPublish = async (publishValue: boolean) => {
    if (selectedProducts.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    try {
      await productsService.bulkPublish(selectedProducts, publishValue);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error in bulk publish:', error);
    }
  };

  const handleBulkFeature = async (featureValue: boolean) => {
    if (selectedProducts.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    try {
      await productsService.bulkFeature(selectedProducts, featureValue);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error in bulk feature:', error);
      alert('Error al actualizar productos');
    }
  };

  const toggleSelectProduct = (uuid: string) => {
    setSelectedProducts(prev =>
      prev.includes(uuid) ? prev.filter(p => p !== uuid) : [...prev, uuid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.uuid));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <Link
          href="/admin/dashboard/productos/nuevo"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nombre, SKU, código de barras..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={categoryUuid}
              onChange={(e) => {
                setCategoryUuid(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={published === undefined ? '' : published ? 'true' : 'false'}
              onChange={(e) => {
                setPublished(e.target.value === '' ? undefined : e.target.value === 'true');
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Publicados</option>
              <option value="false">No publicados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destacado
            </label>
            <select
              value={featured === undefined ? '' : featured ? 'true' : 'false'}
              onChange={(e) => {
                setFeatured(e.target.value === '' ? undefined : e.target.value === 'true');
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Destacados</option>
              <option value="false">No destacados</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Fecha de creación</option>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="inventory">Inventario</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="DESC">Descendente</option>
              <option value="ASC">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedProducts.length} producto(s) seleccionado(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkPublish(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Publicar
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Despublicar
              </button>
              <button
                onClick={() => handleBulkFeature(true)}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Destacar
              </button>
              <button
                onClick={() => handleBulkFeature(false)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Quitar destacado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay productos</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Inventario
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.uuid} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.uuid)}
                        onChange={() => toggleSelectProduct(product.uuid)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.sku}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.customName ?? product.name}
                          </div>
                          {product.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Destacado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {product.categories?.map(c => c.name).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${product.price}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          product.inventory < 10 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {product.inventory}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.published ? 'Publicado' : 'No publicado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/admin/dashboard/productos/${product.uuid}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(product.uuid)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {products.length} de {total} productos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {page} de {lastPage}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === lastPage}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}