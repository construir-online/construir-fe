'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, Package } from 'lucide-react';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesService.getVisible().then((data) => {
      setCategories(data.filter((c) => !c.parent));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="px-3 py-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-1">Categorías</h1>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100 dark:bg-slate-700" />
              <div className="p-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-3/4 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/productos"
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
  );
}
