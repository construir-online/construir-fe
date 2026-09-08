'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

/**
 * Tarjeta compacta de categoría: foto cuadrada redondeada arriba y nombre debajo,
 * como la rejilla de tres columnas del home móvil.
 */
export default function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <Link
      href={`/productos?categoria=${category.uuid}`}
      title={category.name}
      className="group flex flex-col gap-2 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.06}s both` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sand-300 bg-sand-200">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-7 w-7 text-sand-500" strokeWidth={1.6} />
          </div>
        )}
      </div>

      {/*
        Altura de dos líneas reservada: con nombres de una y de dos líneas
        mezclados, la fila de la rejilla crecía por la tarjeta más alta y las
        demás quedaban con un hueco debajo, distinto en cada ancho.
      */}
      <span className="line-clamp-2 min-h-[2.1em] text-[11.5px] font-semibold leading-tight text-ink transition-colors group-hover:text-brand-600 sm:text-sm">
        {category.name}
      </span>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Link>
  );
}
