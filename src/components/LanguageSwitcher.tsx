"use client";

/**
 * Selector de idioma. HOY NO SE MONTA EN NINGUNA PANTALLA: la tienda va fija en
 * español. Se conserva a propósito, entero y compilando, para que reactivarlo
 * sea sólo volver a importarlo desde `Navbar.tsx` y poner
 * `SELECTOR_IDIOMA_ACTIVO = true` en `src/lib/locale.ts` (ahí está el detalle).
 */

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === locale);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = async (newLocale: string) => {
    // Set cookie and refresh
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setIsOpen(false);
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sand-700 hover:bg-sand-100 rounded-lg transition-colors"
        aria-label="Cambiar idioma"
      >
        <Languages className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">
          {currentLanguage?.flag} {currentLanguage?.code.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-sand-300 bg-white-lg border border-sand-300 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-sand-100 transition-colors ${
                locale === lang.code ? 'bg-brand-50 text-brand-600' : 'text-sand-700'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {locale === lang.code && (
                <span className="ml-auto text-brand-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
