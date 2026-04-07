'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';
import type { Product, UpdateProductDto, Category } from '@/types';
import Image from 'next/image';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productUuid = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateProductDto>({});
  const [selectedCategoryUuids, setSelectedCategoryUuids] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inventoryUpdate, setInventoryUpdate] = useState('');

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      if(!productUuid) return;

      setLoading(true);
      const data = await productsService.getByUuid(productUuid as string);
      setProduct(data);

      // Extraer los UUIDs de las categorías actuales del producto
      const categoryUuids = data.categories?.map(cat => cat.uuid) || [];
      setSelectedCategoryUuids(categoryUuids);

      setFormData({
        name: data.name,
        customName: data.customName ?? '',
        inventory: data.inventory,
        price: parseFloat(data.price),
        description: data.description,
        shortDescription: data.shortDescription,
        published: data.published,
        featured: data.featured,
        visibility: data.visibility,
        tags: data.tags,
        categoryUuids: categoryUuids,
      });
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      // Asegurarse de que categoryUuids esté en el formData
      // price e inventory se excluyen — se gestionan por endpoints separados
      const { price: _price, inventory: _inventory, ...rest } = formData;
      const dataToUpdate = {
        ...rest,
        categoryUuids: selectedCategoryUuids,
        customName: formData.customName || null,
      };

      await productsService.update(productUuid as string, dataToUpdate);
      alert('Producto actualizado exitosamente');
      loadProduct();
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar el producto');
    } finally {
      setSaving(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const isPrimary = !product?.images || product.images.length === 0;
      await productsService.uploadImage(productUuid as string, file, isPrimary);
      loadProduct();
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      await productsService.deleteImage(imageUuid);
      loadProduct();
    } catch (error: unknown) {
      console.error('Error deleting image:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la imagen');
    }
  };

  const handleSetPrimaryImage = async (imageUuid: string) => {
    try {
      await productsService.setPrimaryImage(imageUuid);
      loadProduct();
    } catch (error: unknown) {
      console.error('Error setting primary image:', error);
      alert(error instanceof Error ? error.message : 'Error al establecer imagen principal');
    }
  };

  const handleUpdateInventory = async () => {
    const newInventory = parseInt(inventoryUpdate);
    if (isNaN(newInventory) || newInventory < 0) {
      alert('Ingresa un valor válido');
      return;
    }

    try { 
      await productsService.updateInventory(productUuid as string, newInventory);
      alert('Inventario actualizado');
      setInventoryUpdate('');
      loadProduct();
    } catch (error: unknown) {
      console.error('Error updating inventory:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar inventario');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando producto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Producto no encontrado</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {product.customName ?? product.name}
          </h1>
          {product.customName && (
            <p className="text-sm text-gray-500 mt-0.5">
              Nombre oficial: <span className="font-medium">{product.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/admin/dashboard/productos')}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Información básica */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
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
                onClick={() => router.push('/admin/dashboard/productos')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Imágenes e Inventario */}
        <div className="space-y-6">

          {/* Gestión de Imágenes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Imágenes</h2>

            <div className="mb-4">
              <label className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors">
                <span className="text-sm text-gray-600">
                  {uploadingImage ? 'Subiendo...' : 'Haz clic para subir imagen'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              {product.images && product.images.length > 0 ? (
                product.images.map((image) => (
                  <div
                    key={image.uuid}
                    className="relative border rounded-lg overflow-hidden"
                  >
                    <Image
                      src={image.url}
                      alt="Product"
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-2 bg-gray-50 flex justify-between items-center">
                      <div>
                        {image.isPrimary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!image.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryImage(image.uuid)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Marcar principal
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image.uuid)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  No hay imágenes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
