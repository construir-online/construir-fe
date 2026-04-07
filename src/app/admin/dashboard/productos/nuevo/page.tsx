'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';
import type { CreateProductDto, Category } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryUuids, setSelectedCategoryUuids] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    customName: '',
    sku: '',
    inventory: 0,
    price: 0,
    categoryUuids: [],
    description: '',
    shortDescription: '',
    type: 'simple',
    published: true,
    featured: false,
    visibility: 'visible',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getVisible();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCategoryToggle = (categoryUuid: string) => {
    setSelectedCategoryUuids(prev => {
      const newSelection = prev.includes(categoryUuid)
        ? prev.filter(uuid => uuid !== categoryUuid)
        : [...prev, categoryUuid];

      // Actualizar formData con los nuevos UUIDs
      setFormData(current => ({
        ...current,
        categoryUuids: newSelection
      }));

      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás autenticado');
        return;
      }

      // Asegurarse de que categoryUuids esté en el formData
      const dataToCreate = {
        ...formData,
        categoryUuids: selectedCategoryUuids,
        customName: formData.customName || undefined,
      };

      await productsService.create(dataToCreate);
      alert('Producto creado exitosamente');
      router.push('/admin/dashboard/productos');
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Información básica */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre en tienda
                <span className="ml-1 text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.customName ?? ''}
                onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                placeholder={formData.name || 'Ej: Martillo 16oz'}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Si se deja vacío, se usará el nombre del producto.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                readOnly
                value={formData.price}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventario
              </label>
              <input
                type="number"
                readOnly
                value={formData.inventory}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay categorías disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {[...categories]
                      .sort((a, b) => {
                        const aSelected = selectedCategoryUuids.includes(a.uuid);
                        const bSelected = selectedCategoryUuids.includes(b.uuid);
                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((category) => (
                        <label
                          key={category.uuid}
                          className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoryUuids.includes(category.uuid)}
                            onChange={() => handleCategoryToggle(category.uuid)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900">{category.name}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
              {selectedCategoryUuids.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {selectedCategoryUuids.length} {selectedCategoryUuids.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producto
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'simple' | 'variable' })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="simple">Simple</option>
                <option value="variable">Variable</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Corta
              </label>
              <textarea
                value={formData.shortDescription || ''}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Completa
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Etiquetas</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Agregar etiqueta..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Configuración */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibilidad
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'visible' | 'hidden' | 'catalog' | 'search' })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Oculto</option>
                <option value="catalog">Solo catálogo</option>
                <option value="search">Solo búsqueda</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Publicado</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Destacado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
