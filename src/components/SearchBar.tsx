'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import { productsService } from '@/services/products';
import type { Product } from '@/types';
import { parsePrice, formatUSD } from '@/lib/currency';

interface SearchBarProps {
  inputClassName?: string;
  onSearch?: () => void;
  onClickOutside?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ inputClassName = '', onSearch, onClickOutside, autoFocus = false }: SearchBarProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [query, setQuery] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setShowDropdown(false);
    router.push(`/productos?search=${encodeURIComponent(q)}`);
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
    router.push(`/productos?search=${encodeURIComponent(q)}`);
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={t('search', { defaultValue: 'Buscar...' })}
          autoFocus={autoFocus}
          className={`w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-left transition-colors"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                      {primaryImage ? (
                        <Image src={primaryImage} alt={product.name} width={40} height={40} className="object-contain" />
                      ) : (
                        <Search className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{product.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{formatUSD(parsePrice(product.price))}</p>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleViewAll}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700 transition-colors"
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
