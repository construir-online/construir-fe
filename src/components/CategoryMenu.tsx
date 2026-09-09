'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import { buildCategoryHref } from '@/lib/product-list-params';
import { ChevronDown, ChevronRight, Grid } from 'lucide-react';

export function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentCategory = searchParams.get('categoria');

  /*
   * Cambiar de categoría conservaba sólo la categoría: la búsqueda y el orden
   * se perdían porque el enlace era `/productos?categoria=X` a pelo. Los
   * filtros del listado sólo se arrastran cuando ya se está EN el listado; en
   * la barra lateral de otras pantallas los query params son de esa otra
   * pantalla y no tienen nada que ver con el catálogo.
   */
  const hrefDeCategoria = (uuid: string | null) =>
    buildCategoryHref(uuid, pathname === '/productos' ? searchParams : undefined);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const allCats = categories.flatMap(c => [c, ...(c.childrens ?? [])]);
    setSelectedCategory(allCats.find(c => c.uuid === currentCategory) ?? null);
  }, [currentCategory, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getVisible();

      const parentCategories = data.filter(cat => !cat.parent);
      setCategories(parentCategories);

      if (currentCategory) {
        const allCats = data.flatMap(c => [c, ...(c.childrens ?? [])]);
        const currentCat = allCats.find(c => c.uuid === currentCategory);
        setSelectedCategory(currentCat ?? null);
        if (currentCat?.parent) {
          setExpandedCategories(new Set([currentCat.parent.uuid]));
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (uuid: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-sand-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    /*
     * El árbol se desplaza por su cuenta desde md y encima se queda pegado
     * desde lg: con las 100 categorías del catálogo medía 4971px y era él quien
     * fijaba la altura de toda la página de productos, dejando kilómetros de
     * blanco a la derecha de la rejilla. En tablet pasaba lo mismo al abrir el
     * acordeón (la página se iba a 8354px).
     */
    <div className="rounded-2xl border border-sand-300 bg-white md:flex md:max-h-[calc(100vh-3rem)] md:flex-col md:overflow-hidden lg:sticky lg:top-6">
      {/* Header — toggle en mobile, estático en desktop */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(prev => !prev)}
        aria-expanded={isMenuOpen}
        className="flex min-h-11 w-full flex-none items-center justify-between gap-2 border-b border-sand-200 p-4 text-left lg:pointer-events-none lg:cursor-default"
      >
        <h2 className="flex min-w-0 items-center gap-2 font-display text-base font-bold text-ink">
          <Grid className="w-5 h-5 flex-none" />
          Categorías
          {selectedCategory && (
            <span className="ml-1 truncate text-sm font-normal text-brand-600">
              · {selectedCategory.name}
            </span>
          )}
        </h2>
        <ChevronDown
          className={`w-5 h-5 flex-none text-sand-600 transition-transform lg:hidden ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido — visible siempre en desktop, toggle en mobile */}
      <nav className={`p-2 ${isMenuOpen ? 'block' : 'hidden'} md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain lg:block`}>
        {/* All Products Link */}
        <Link
          href={hrefDeCategoria(null)}
          onClick={() => setIsMenuOpen(false)}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm transition-colors ${
            !currentCategory
              ? 'bg-brand-50 font-bold text-brand-700'
              : 'text-sand-700 hover:bg-sand-100'
          }`}
        >
          <Grid className="w-4 h-4" />
          Todos los productos
        </Link>

        {/* Category Tree */}
        <div className="mt-2 space-y-1">
          {categories.map((category) => {
            const hasChildren = category.childrens && category.childrens.length > 0;
            const isExpanded = expandedCategories.has(category.uuid);
            const isActive = currentCategory === category.uuid;

            return (
              <div key={category.uuid}>
                {/* Parent Category */}
                <div className="flex items-center">
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.uuid)}
                      aria-expanded={isExpanded}
                      /* Medía 24x24: imposible de acertar con el dedo. Ojo:
                         hoy ninguna categoría del catálogo tiene hijas, así que
                         esta rama no llega a pintarse en la tienda real. */
                      className="touch-target -ml-1 flex flex-none items-center justify-center rounded transition-colors hover:bg-sand-100"
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-sand-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-sand-600" />
                      )}
                    </button>
                  )}
                  <Link
                    href={hrefDeCategoria(category.uuid)}
                    onClick={() => setIsMenuOpen(false)}
                    /* min-w-0 + break-words: los nombres largos en mayúsculas
                       desbordaban la columna de 256px del escritorio. */
                    className={`flex min-h-11 min-w-0 flex-1 items-center break-words rounded-xl px-3 py-1.5 text-sm transition-colors ${
                      !hasChildren ? 'ml-10' : ''
                    } ${
                      isActive
                        ? 'bg-brand-50 font-bold text-brand-700'
                        : 'text-sand-700 hover:bg-sand-100'
                    }`}
                  >
                    {category.name}
                    {hasChildren && (
                      <span className="ml-2 text-xs text-sand-600">
                        ({category.childrens?.length || 0})
                      </span>
                    )}
                  </Link>
                </div>

                {/* Subcategories */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.childrens?.map((child) => {
                      const isChildActive = currentCategory === child.uuid;
                      return (
                        <Link
                          key={child.uuid}
                          href={hrefDeCategoria(child.uuid)}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex min-h-11 min-w-0 items-center break-words rounded-xl px-3 py-1.5 text-sm transition-colors ${
                            isChildActive
                              ? 'bg-brand-50 font-bold text-brand-700'
                              : 'text-sand-700 hover:bg-sand-100'
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
