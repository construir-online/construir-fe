'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import CategoryTile from './category/CategoryTile';
import { CATEGORY_GRID_CLASS, contarEsqueletos } from '@/lib/category-grid';

/*
 * OJO: hoy no lo importa ningún archivo. La navegación inferior lleva a la
 * página /categorias en su lugar. Se mantiene sincronizado con CategoryTile
 * para que no se pudra, pero conviene decidir si se borra o se conecta.
 */
interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryDrawer({ isOpen, onClose }: CategoryDrawerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesService.getVisible().then((data) => {
      setCategories(data.filter((c) => !c.parent));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-300 flex-shrink-0">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          Categorías
        </h2>
        <button
          type="button"
          onClick={onClose}
          /* touch-target: el botón medía 36px y quedaba por debajo del mínimo
             de 44px que pide el diseño móvil. */
          className="touch-target flex items-center justify-center rounded-lg text-sand-600 transition-colors hover:bg-sand-100 hover:text-ink"
          aria-label="Cerrar categorías"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Rejilla */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className={CATEGORY_GRID_CLASS}>
            {Array.from({ length: contarEsqueletos(3, 12) }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-sand-100" />
                <div className="flex min-h-[2.75rem] items-start justify-center px-1 py-2">
                  <div className="h-3 w-3/4 rounded bg-sand-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={CATEGORY_GRID_CLASS}>
            <CategoryTile onNavigate={onClose} />
            {categories.map((category) => (
              <CategoryTile key={category.uuid} category={category} onNavigate={onClose} />
            ))}
          </div>
        )}
      </div>

      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom)] flex-shrink-0" />
    </div>
  );
}
