'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';
import type { Product, UpdateProductDto, Category } from '@/types';
import Image from 'next/image';
import CategoryPickerModal from '@/components/admin/CategoryPickerModal';

type Tab = 'info' | 'descripcion' | 'etiquetas' | 'configuracion';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Información' },
  { id: 'descripcion', label: 'Descripción' },
  { id: 'etiquetas', label: 'Etiquetas' },
  { id: 'configuracion', label: 'Configuración' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productUuid = params.id;

  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateProductDto>({});
  const [selectedCategoryUuids, setSelectedCategoryUuids] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inventoryUpdate, setInventoryUpdate] = useState('');

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      if (!productUuid) return;
      setLoading(true);
      const data = await productsService.getByUuid(productUuid as string);
      setProduct(data);

      const categoryUuids = data.categories?.map((cat) => cat.uuid) || [];
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

  const handleCategoryConfirm = (uuids: string[]) => {
    setSelectedCategoryUuids(uuids);
    setFormData((current) => ({ ...current, categoryUuids: uuids }));
  };

  const removeCategory = (uuid: string) => {
    const updated = selectedCategoryUuids.filter((id) => id !== uuid);
    setSelectedCategoryUuids(updated);
    setFormData((current) => ({ ...current, categoryUuids: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
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
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) });
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

  const selectedCategories = categories.filter((c) =>
    selectedCategoryUuids.includes(c.uuid)
  );

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
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
            {/* Tab bar */}
            <div className="border-b border-gray-200 px-6">
              <div className="flex gap-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6">

              {/* ── Información ── */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.price}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inventario</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.inventory}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Categorías */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Categorías</label>
                      <button
                        type="button"
                        onClick={() => setCategoryModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar categoría
                      </button>
                    </div>

                    {selectedCategories.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Sin categorías</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map((cat) => (
                          <span
                            key={cat.uuid}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-sm"
                          >
                            {cat.name}
                            <button
                              type="button"
                              onClick={() => removeCategory(cat.uuid)}
                              className="text-blue-400 hover:text-blue-700 transition-colors"
                              aria-label={`Quitar ${cat.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Descripción ── */}
              {activeTab === 'descripcion' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción Corta
                    </label>
                    <textarea
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      rows={3}
                      placeholder="Resumen breve del producto..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción Completa
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      placeholder="Descripción detallada del producto..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* ── Etiquetas ── */}
              {activeTab === 'etiquetas' && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Escribir etiqueta y presionar Enter..."
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
                  {formData.tags && formData.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-blue-400 hover:text-blue-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin etiquetas</p>
                  )}
                </div>
              )}

              {/* ── Configuración ── */}
              {activeTab === 'configuracion' && (
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Publicado</p>
                      <p className="text-xs text-gray-500 mt-0.5">El producto será visible en el catálogo público.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Destacado</p>
                      <p className="text-xs text-gray-500 mt-0.5">Aparecerá en la sección de productos destacados en el inicio.</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Acciones — siempre visibles */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard/productos')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar — siempre visible */}
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
                  <div key={image.uuid} className="relative border rounded-lg overflow-hidden">
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

          {/* Inventario rápido */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actualizar inventario</h2>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={inventoryUpdate}
                onChange={(e) => setInventoryUpdate(e.target.value)}
                placeholder={`Actual: ${product.inventory}`}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={handleUpdateInventory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryPickerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        selectedUuids={selectedCategoryUuids}
        onConfirm={handleCategoryConfirm}
      />
    </div>
  );
}
