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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
            className="inline-block px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('viewAllProducts')}
          </Link>
        </div>
      </div>
    </section>
  );
}
