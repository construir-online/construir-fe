'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import { buildCategoryHref } from '@/lib/product-list-params';

interface CategoryChipsProps {
  className?: string;
}

/**
 * Fila de categorías desplazable en horizontal. El chip activo va en tinta sólida
 * y el resto en blanco con borde cálido, como en el diseño móvil.
 */
export default function CategoryChips({ className = '' }: CategoryChipsProps) {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeUuid = searchParams.get('categoria');

  /*
   * Cambiar de categoría conservaba sólo la categoría: la búsqueda y el orden
   * se perdían porque el enlace era `/productos?categoria=X` a pelo. Los
   * filtros del listado sólo se arrastran cuando ya se está EN el listado; en
   * las demás pantallas donde se pintan los chips, los query params son de esa
   * otra pantalla y no tienen nada que ver con el catálogo.
   */
  const hrefDeCategoria = (uuid: string | null) =>
    buildCategoryHref(uuid, pathname === '/productos' ? searchParams : undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const filaRef = useRef<HTMLDivElement>(null);
  const activoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    categoriesService
      .getFeatured()
      .then(setCategories)
      .catch((error) => console.error('Error loading category chips:', error));
  }, []);

  /*
   * Al entrar por una URL con ?categoria=..., el chip activo podía quedar fuera
   * de la parte visible del scroller y parecía que no había ningún filtro puesto.
   */
  useEffect(() => {
    const chip = activoRef.current;
    const fila = filaRef.current;
    // typeof: jsdom (y navegadores viejos) no implementan scrollTo con opciones
    if (!chip || !fila || !activeUuid || typeof fila.scrollTo !== 'function') return;
    fila.scrollTo({
      left: chip.offsetLeft - fila.clientWidth / 2 + chip.offsetWidth / 2,
      behavior: 'smooth',
    });
  }, [activeUuid, categories]);

  if (categories.length === 0) return null;

  const chipCls = (active: boolean) =>
    `flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[12.5px] transition-colors ${
      active
        ? 'bg-ink font-bold text-white'
        : 'border border-sand-300 bg-white font-semibold text-sand-700 hover:border-sand-400'
    }`;

  return (
    <div ref={filaRef} className={`chip-row ${className}`}>
      <Link
        href={hrefDeCategoria(null)}
        aria-current={!activeUuid ? 'page' : undefined}
        className={chipCls(!activeUuid)}
      >
        {t('allProducts')}
      </Link>
      {categories.map((category) => {
        const activo = activeUuid === category.uuid;
        return (
          <Link
            key={category.uuid}
            ref={activo ? activoRef : undefined}
            href={hrefDeCategoria(category.uuid)}
            aria-current={activo ? 'page' : undefined}
            className={chipCls(activo)}
          >
            {category.name}
          </Link>
        );
      })}
      {/*
        Cierre del scroller: el padding derecho del contenedor se ignora al
        llegar al final del scroll en WebKit y el último chip quedaba pegado al
        borde de la pantalla.
      */}
      <span aria-hidden="true" className="flex-none pe-4" />
    </div>
  );
}
