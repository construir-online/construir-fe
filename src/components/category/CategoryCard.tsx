'use client';

import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export default function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <Link
      href={`/productos?category=${category.slug}`}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
      }}
    >
      {/* Imagen o icono de categoría */}
      <div className="aspect-[4/3] relative bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 overflow-hidden">
        {category.image ? (
          <>
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay oscuro en hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <Package className="relative w-16 h-16 text-blue-500 group-hover:text-blue-600 transition-colors group-hover:scale-110 duration-300" />
            </div>
          </div>
        )}

        {/* Badge de "Ver productos" */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-5">
        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 line-clamp-1">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
