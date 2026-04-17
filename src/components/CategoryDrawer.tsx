'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, LayoutGrid, Package } from 'lucide-react';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';

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
    <div className="fixed inset-0 z-50 md:hidden bg-white dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          Categorías
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Cerrar categorías"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-pulse">
                <div className="aspect-square bg-gray-100 dark:bg-slate-700" />
                <div className="p-2">
                  <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-3/4 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* Todos los productos */}
            <Link
              href="/productos"
              onClick={onClose}
              className="rounded-xl overflow-hidden hover:shadow-md transition-all active:scale-95"
            >
              <div className="aspect-square bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <LayoutGrid className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="p-2 text-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight line-clamp-2">
                  Todos
                </span>
              </div>
            </Link>

            {categories.map((category) => (
              <Link
                key={category.uuid}
                href={`/productos?categoria=${category.uuid}`}
                onClick={onClose}
                className="rounded-xl overflow-hidden hover:shadow-md transition-all active:scale-95"
              >
                <div className="aspect-square relative bg-gray-50 dark:bg-slate-800">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="p-2 text-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight line-clamp-2">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom)] flex-shrink-0" />
    </div>
  );
}
