'use client';

import { useState, useEffect } from 'react';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import CategoryTile from '@/components/category/CategoryTile';
import {
  CATEGORY_GRID_CLASS,
  CATEGORY_GRID_MAX_COLS,
  contarEsqueletos,
} from '@/lib/category-grid';

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
    /*
     * pb-24 en móvil porque la barra de navegación inferior es fija y tapaba
     * los nombres de la última fila. El contenedor max-w-7xl alinea la rejilla
     * con el navbar y el footer: sin él, en escritorio el contenido se pegaba
     * a los bordes de la ventana.
     */
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
      <h1 className="mb-4 text-lg font-semibold text-ink sm:mb-6 sm:text-2xl">Categorías</h1>

      {loading ? (
        <div className={CATEGORY_GRID_CLASS}>
          {Array.from({ length: contarEsqueletos(CATEGORY_GRID_MAX_COLS, 24) }).map((_, i) => (
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
          <CategoryTile />
          {categories.map((category) => (
            <CategoryTile key={category.uuid} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
