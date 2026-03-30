'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import { ChevronDown, ChevronRight, Grid } from 'lucide-react';

export function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('categoria');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getVisible();

      const parentCategories = data.filter(cat => !cat.parent);
      setCategories(parentCategories);

      if (currentCategory) {
        const currentCat = data.find(c => c.slug === currentCategory);
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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header — toggle en mobile, estático en desktop */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 lg:cursor-default"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Grid className="w-5 h-5" />
          Categorías
          {currentCategory && (
            <span className="ml-1 text-sm font-normal text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
              · {currentCategory}
            </span>
          )}
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform lg:hidden ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido — visible siempre en desktop, toggle en mobile */}
      <nav className={`p-2 ${isMenuOpen ? 'block' : 'hidden'} lg:block`}>
        {/* All Products Link */}
        <Link
          href="/productos"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            !currentCategory
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
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
            const isActive = currentCategory === category.slug;

            return (
              <div key={category.uuid}>
                {/* Parent Category */}
                <div className="flex items-center">
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(category.uuid)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  )}
                  <Link
                    href={`/productos?categoria=${category.slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                      !hasChildren ? 'ml-5' : ''
                    } ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {category.name}
                    {hasChildren && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({category.childrens?.length || 0})
                      </span>
                    )}
                  </Link>
                </div>

                {/* Subcategories */}
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.childrens?.map((child) => {
                      const isChildActive = currentCategory === child.slug;
                      return (
                        <Link
                          key={child.uuid}
                          href={`/productos?categoria=${child.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            isChildActive
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
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
