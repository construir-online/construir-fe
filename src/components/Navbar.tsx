"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronDown, Package, LogOut, X } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import CartButton from "./cart/CartButton";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchBar from "./SearchBar";

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { openCart } = useCart();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setIsUserMenuOpen(false);
    router.refresh();
  };

  const userInitial = user?.firstName?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-md dark:shadow-slate-800/50 sticky top-0 z-50 border-b border-transparent dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main nav row */}
        <div className="flex items-center gap-3 h-16">

          {/* Logo */}
          <Link href="/" className={`flex items-center flex-shrink-0 ${isMobileSearchActive ? 'hidden md:flex' : ''}`}>
            <Image
              src="/construir-logo.png"
              alt="Construir Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Mobile search (expandable) */}
          <div className="md:hidden flex items-center gap-2 flex-1">
            <div className="flex-1" onClick={() => setIsMobileSearchActive(true)}>
              <SearchBar
                onSearch={() => setIsMobileSearchActive(false)}
                onClickOutside={() => setIsMobileSearchActive(false)}
                autoFocus={isMobileSearchActive}
              />
            </div>
            {isMobileSearchActive && (
              <button
                type="button"
                onClick={() => setIsMobileSearchActive(false)}
                className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* ── Desktop Navigation ── */}
          <div className="hidden md:flex items-center gap-5 ml-auto">
            <Link
              href="/productos"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm"
            >
              {t('products')}
            </Link>
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm"
            >
              {t('about')}
            </Link>

            <div className="w-44">
              <SearchBar inputClassName="" />
            </div>

            <CartButton onClick={openCart} />

            {/* ── Logged in: user dropdown ── */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold select-none">
                    {userInitial}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[96px] truncate">
                    {user.firstName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {!isAdmin && (
                      <Link
                        href="/mi-cuenta/ordenes"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        {t('myOrders')}
                      </Link>
                    )}

                    <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
                        Idioma
                      </p>
                      <div className="flex gap-1.5">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center ${
                              locale === lang.code
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.code.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <LanguageSwitcher />
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors text-sm"
                  >
                    {t('register')}
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile: Language switcher (hidden when search is active) */}
          {!isMobileSearchActive && (
            <div className="flex md:hidden items-center flex-shrink-0">
              <LanguageSwitcher />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
