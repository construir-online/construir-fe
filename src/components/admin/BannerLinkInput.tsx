'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import type { Product, Category } from '@/types';
import { productsService } from '@/services/products';
import { categoriesService } from '@/services/categories';

type LinkType = 'url' | 'product' | 'category';

interface BannerLinkInputProps {
  value: string;
  onChange: (url: string) => void;
}

interface ProductPickerModalProps {
  onSelect: (product: Pick<Product, 'uuid' | 'name' | 'sku'>) => void;
  onClose: () => void;
}

interface CategoryPickerModalProps {
  onSelect: (category: Pick<Category, 'slug' | 'name'>) => void;
  onClose: () => void;
}

function ProductPickerModal({ onSelect, onClose }: ProductPickerModalProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadProducts = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const results = await productsService.search(searchQuery);
        setProducts(results);
      } else {
        const results = await productsService.getPaginated({ limit: 20, published: true });
        setProducts(results.data);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts('');
  }, [loadProducts]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProducts(value);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-picker-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="product-picker-title" className="text-base font-semibold text-gray-900">
            Seleccionar Producto
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent focus-visible:outline-none text-sm"
          />
        </div>

        <div className="overflow-y-auto flex-1 -mx-2">
          {loading ? (
            <div className="space-y-2 px-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {query ? 'No se encontraron productos para esta búsqueda.' : 'No hay productos disponibles.'}
            </div>
          ) : (
            <ul className="px-2 space-y-1">
              {products.map((product) => (
                <li key={product.uuid}>
                  <button
                    onClick={() => onSelect(product)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900 truncate">{product.customName ?? product.name}</span>
                      <span className="flex-shrink-0 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {product.sku}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryPickerModal({ onSelect, onClose }: CategoryPickerModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    categoriesService.getAll()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-picker-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="category-picker-title" className="text-base font-semibold text-gray-900">
            Seleccionar Categoría
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-2">
          {loading ? (
            <div className="space-y-2 px-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No hay categorías disponibles.
            </div>
          ) : (
            <ul className="px-2 space-y-1">
              {categories.map((category) => (
                <li key={category.uuid}>
                  <button
                    onClick={() => onSelect(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors text-sm text-gray-900${category.parent ? ' pl-8' : ''}`}
                  >
                    {category.parent && (
                      <span className="text-gray-400 mr-1">└</span>
                    )}
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BannerLinkInput({ value, onChange }: BannerLinkInputProps) {
  const [linkType, setLinkType] = useState<LinkType>('url');
  const [selectedProduct, setSelectedProduct] = useState<Pick<Product, 'uuid' | 'name' | 'sku'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Pick<Category, 'slug' | 'name'> | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Detect link type from initial value and rehydrate selection
  useEffect(() => {
    if (!value) {
      setLinkType('url');
      return;
    }

    const productMatch = value.match(/^\/productos\/([^/]+)$/);
    if (productMatch) {
      setLinkType('product');
      productsService.getByUuid(productMatch[1])
        .then((product) => setSelectedProduct(product))
        .catch(() => setLinkType('url'));
      return;
    }

    const categoryMatch = value.match(/^\/categorias\/([^/]+)$/);
    if (categoryMatch) {
      setLinkType('category');
      categoriesService.getBySlug(categoryMatch[1])
        .then((category) => setSelectedCategory(category))
        .catch(() => setLinkType('url'));
      return;
    }

    setLinkType('url');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (newType: LinkType) => {
    if (newType === linkType) return;
    setLinkType(newType);
    setSelectedProduct(null);
    setSelectedCategory(null);
    onChange('');
  };

  const handleProductSelect = (product: Pick<Product, 'uuid' | 'name' | 'sku'>) => {
    setSelectedProduct(product);
    onChange(`/productos/${product.uuid}`);
    setShowProductModal(false);
  };

  const handleCategorySelect = (category: Pick<Category, 'slug' | 'name'>) => {
    setSelectedCategory(category);
    onChange(`/categorias/${category.slug}`);
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Segmented control */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1" role="group" aria-label="Tipo de enlace">
        {([
          { type: 'url', label: 'URL personalizada' },
          { type: 'product', label: 'Producto' },
          { type: 'category', label: 'Categoría' },
        ] as { type: LinkType; label: string }[]).map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            aria-pressed={linkType === type}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              linkType === type
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* URL mode */}
      {linkType === 'url' && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent focus-visible:outline-none"
          placeholder="https://ejemplo.com/destino"
        />
      )}

      {/* Product mode */}
      {linkType === 'product' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm min-h-[42px] flex items-center">
            {selectedProduct ? (
              <span className="text-gray-900">{selectedProduct.name}</span>
            ) : (
              <span className="text-gray-400">Ningún producto seleccionado</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors whitespace-nowrap"
          >
            {selectedProduct ? 'Cambiar' : 'Seleccionar'}
          </button>
        </div>
      )}

      {/* Category mode */}
      {linkType === 'category' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm min-h-[42px] flex items-center">
            {selectedCategory ? (
              <span className="text-gray-900">{selectedCategory.name}</span>
            ) : (
              <span className="text-gray-400">Ninguna categoría seleccionada</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors whitespace-nowrap"
          >
            {selectedCategory ? 'Cambiar' : 'Seleccionar'}
          </button>
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductPickerModal
          onSelect={handleProductSelect}
          onClose={() => setShowProductModal(false)}
        />
      )}
      {showCategoryModal && (
        <CategoryPickerModal
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
}
