'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import CategoryCard from './category/CategoryCard';
import CategoryCardSkeleton from './category/CategoryCardSkeleton';

export default function FeaturedCategories() {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCategories();
  }, []);

  const loadFeaturedCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getFeatured();
      setCategories(data);
    } catch (error) {
      console.error('Error loading featured categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64 mx-auto animate-pulse" />
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="py-16 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header mejorado */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('featuredCategories', { defaultValue: 'Categorías Destacadas' })}
          </h2>
        </div>

        {/* Grid de categorías mejorado */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={category.uuid} category={category} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}