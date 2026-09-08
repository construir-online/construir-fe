'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import CategoryCard from './category/CategoryCard';
import CategoryCardSkeleton from './category/CategoryCardSkeleton';
import SectionHeader from './SectionHeader';
import { FEATURED_GRID_CLASS, FEATURED_MAX, limitarDestacadas } from '@/lib/category-grid';

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

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('featuredCategories')}
          actionLabel={t('viewAll')}
          actionHref="/categorias"
          className="mb-3 sm:mb-5"
        />

        {/*
          Sólo 3 o 6 columnas: el paso intermedio de 4 dejaba la última fila con
          tres huecos entre 640px y 1023px, porque aquí se muestran seis
          categorías como mucho y 4 no divide a 6.
        */}
        <div className={FEATURED_GRID_CLASS}>
          {loading
            ? Array.from({ length: FEATURED_MAX }).map((_, i) => <CategoryCardSkeleton key={i} />)
            : limitarDestacadas(categories).map((category, index) => (
                <CategoryCard key={category.uuid} category={category} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
}
