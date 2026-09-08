'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import CategoryCard from './category/CategoryCard';
import CategoryCardSkeleton from './category/CategoryCardSkeleton';
import SectionHeader from './SectionHeader';
import {
  FEATURED_GRID_CLASS,
  FEATURED_MAX,
  columnasDestacadas,
  limitarDestacadas,
} from '@/lib/category-grid';

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

  const destacadas = limitarDestacadas(categories);

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
          A partir de 640px la fila tiene tantas columnas como categorías: el
          backend devuelve cinco destacadas y con un número fijo de columnas
          (cuatro antes, seis después) siempre sobraba hueco a la derecha.
        */}
        <div
          className={FEATURED_GRID_CLASS}
          style={
            {
              '--destacadas': columnasDestacadas(loading ? FEATURED_MAX : destacadas.length),
            } as React.CSSProperties
          }
        >
          {loading
            ? Array.from({ length: FEATURED_MAX }).map((_, i) => <CategoryCardSkeleton key={i} />)
            : destacadas.map((category, index) => (
                <CategoryCard key={category.uuid} category={category} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
}
