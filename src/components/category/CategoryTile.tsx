'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, Package } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryTileProps {
  /** Sin categoría se pinta el acceso a "Todos los productos". */
  category?: Category;
  onNavigate?: () => void;
}

/**
 * Casilla cuadrada de categoría del catálogo completo. La usan la página
 * /categorias y el CategoryDrawer, que tenían el mismo markup copiado y
 * pegado. (El drawer hoy no lo importa nadie: ver la nota en su cabecera.)
 *
 * El nombre reserva la altura de dos líneas: como unos nombres ocupan una línea
 * y otros dos, las filas de la rejilla quedaban con las imágenes a distinta
 * altura y se veía un dentado feo al cambiar de ancho.
 */
export default function CategoryTile({ category, onNavigate }: CategoryTileProps) {
  const esTodos = !category;
  const nombre = category?.name ?? 'Todos';

  return (
    <Link
      href={category ? `/productos?categoria=${category.uuid}` : '/productos'}
      onClick={onNavigate}
      title={nombre}
      className="group flex flex-col rounded-xl transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-95"
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-xl ${
          esTodos ? 'bg-brand-50' : 'bg-sand-50'
        }`}
      >
        {esTodos ? (
          <div className="flex h-full w-full items-center justify-center">
            <LayoutGrid className="h-7 w-7 text-brand-500 sm:h-9 sm:w-9" />
          </div>
        ) : category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover"
            /* Antes decía siempre 33vw: en escritorio la rejilla llega a 8
               columnas y se descargaban imágenes tres veces más grandes. */
            sizes="(max-width: 639px) 33vw, (max-width: 767px) 25vw, (max-width: 1023px) 20vw, (max-width: 1279px) 17vw, 14vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-7 w-7 text-sand-500 sm:h-9 sm:w-9" />
          </div>
        )}
      </div>

      <div className="flex min-h-[2.75rem] items-start justify-center px-1 py-2">
        <span className="line-clamp-2 text-center text-[11.5px] font-medium leading-tight text-sand-700 transition-colors group-hover:text-brand-600 sm:text-xs">
          {nombre}
        </span>
      </div>
    </Link>
  );
}
