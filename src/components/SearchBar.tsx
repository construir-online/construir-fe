'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import { productsService } from '@/services/products';
import type { Product } from '@/types';
import { parsePrice, formatUSD } from '@/lib/currency';
import { buildSearchHref } from '@/lib/product-list-params';

interface SearchBarProps {
  inputClassName?: string;
  onSearch?: () => void;
  onClickOutside?: () => void;
  autoFocus?: boolean;
}

function SearchBarContent({ inputClassName = '', onSearch, onClickOutside, autoFocus = false }: SearchBarProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // En el listado la barra arranca con el término que ya está en la URL: al
  // recargar o volver con "atrás", lo que se ve escrito coincide con lo que se
  // está mostrando.
  const [query, setQuery] = useState(
    () => (pathname === '/productos' ? searchParams.get('search') ?? '' : ''),
  );
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        onClickOutside?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await productsService.getPublicPaginated({ search: q.trim(), limit: 6 });
      setSuggestions(res.data);
      setShowDropdown(res.data.length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  /**
   * A dónde lleva buscar `q`.
   *
   * Regresión: esto hacía `router.push('/productos?search=' + q)`, que
   * reescribe la URL entera. Si el usuario venía filtrando por una categoría y
   * escribía algo en la barra, la categoría y el orden desaparecían y se
   * encontraba buscando en todo el catálogo sin haber tocado los filtros.
   *
   * Los filtros sólo se conservan cuando ya se está EN el listado: buscar
   * desde el navbar en la portada o en una ficha de producto tiene que llevar
   * al catálogo completo, no arrastrar parámetros de otra pantalla.
   */
  const hrefDeBusqueda = (q: string) =>
    buildSearchHref(q, pathname === '/productos' ? searchParams : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setShowDropdown(false);
    router.push(hrefDeBusqueda(q));
    onSearch?.();
  };

  const handleSelect = (product: Product) => {
    setShowDropdown(false);
    setQuery('');
    router.push(`/productos/${product.uuid}`);
    onSearch?.();
  };

  const handleViewAll = () => {
    const q = query.trim();
    if (!q) return;
    setShowDropdown(false);
    router.push(hrefDeBusqueda(q));
    onSearch?.();
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-600 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={t('search', { defaultValue: 'Buscar cemento, cabillas, tubos…' })}
          autoFocus={autoFocus}
          className={`w-full rounded-2xl border border-sand-300 bg-sand-100 py-3 pl-10 pr-9 text-sm font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 md:rounded-xl md:py-2 ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sand-600 hover:bg-sand-200 hover:text-sand-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sand-300 rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {suggestions.map((product) => {
                const primaryImage = product.images?.find((img) => img.isPrimary)?.url;
                return (
                  <button
                    key={product.uuid}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(product)}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-sand-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded bg-sand-100 overflow-hidden flex items-center justify-center">
                      {primaryImage ? (
                        <Image src={primaryImage} alt={product.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <Search className="w-4 h-4 text-sand-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sand-700 truncate">{product.customName ?? product.name}</p>
                      <p className="text-xs text-brand-600">{formatUSD(parsePrice(product.price))}</p>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleViewAll}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium text-brand-600 hover:bg-brand-50 border-t border-sand-200 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Ver todos los resultados para &ldquo;{query}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * `useSearchParams` obliga a un límite de Suspense para que las páginas que
 * montan la barra (el navbar va en el layout, o sea todas) se puedan seguir
 * prerenderizando; sin él `next build` falla.
 */
export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<div className="h-11 w-full rounded-2xl bg-sand-100 md:h-10 md:rounded-xl" />}>
      <SearchBarContent {...props} />
    </Suspense>
  );
}
