'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { productsService } from '@/services/products';
import type { Product } from '@/types';
import ProductCard from './product/ProductCard';
import ProductCardSkeleton from './product/ProductCardSkeleton';

export default function FeaturedProducts() {
  const t = useTranslations('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      // Obtener productos destacados y publicados
      const response = await productsService.getPublicPaginated({
        featured: true,
        limit: 8,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error loading featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative -mt-20 py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile skeleton */}
          <div className="sm:hidden overflow-x-auto -mx-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex-shrink-0 w-40">
                  <ProductCardSkeleton variant="compact" />
                </div>
              ))}
            </div>
          </div>
          {/* Desktop skeleton */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="relative -mt-20 py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: scroll horizontal */}
          <div className="sm:hidden overflow-x-auto snap-x snap-mandatory scroll-pl-4 -mx-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 px-4">
              {products.map((product, index) => (
                <div key={product.uuid} className="flex-shrink-0 w-40 snap-start">
                  <ProductCard
                    product={product}
                    variant="compact"
                    showAddToCart={false}
                    showBadges={false}
                    showSku={false}
                    showDescription={false}
                    showStock={false}
                    priority={index < 4}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.uuid}
                product={product}
                variant="compact"
                showAddToCart={false}
                showBadges={false}
                showSku={false}
                showDescription={false}
                showStock={false}
                priority={index < 4}
              />
            ))}
          </div>

        {/* Ver más productos */}
        <div className="mt-12 text-center">
          <Link
            href="/productos"
            className="inline-block px-8 py-3 text-lg font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {t('viewAllProducts')}
          </Link>
        </div>
      </div>
    </section>
  );
}
