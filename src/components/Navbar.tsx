"use client";

import { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import CartButton from "./cart/CartButton";
import CartDrawer from "./cart/CartDrawer";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const cancelMobileSearch = () => {
    setIsMobileSearchActive(false);
  };

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 shadow-md dark:shadow-slate-800/50 sticky top-0 z-50 border-b border-transparent dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            {/* Logo — oculto en mobile cuando la búsqueda está activa */}
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

            {/* Búsqueda mobile — siempre visible, se expande al hacer focus */}
            <div className="md:hidden flex items-center gap-2 flex-1">
              <div className="flex-1" onClick={() => setIsMobileSearchActive(true)}>
                <SearchBar
                  onSearch={cancelMobileSearch}
                  onClickOutside={cancelMobileSearch}
                  autoFocus={isMobileSearchActive}
                />
              </div>
              {isMobileSearchActive && (
                <button
                  type="button"
                  onClick={cancelMobileSearch}
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 ml-auto">
              <Link
                href="/productos"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                {t('products')}
              </Link>

              <Link
                href="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                {t('about')}
              </Link>

              {/* Barra de búsqueda */}
              <div className="w-48">
                <SearchBar inputClassName="" />
              </div>

              {/* Botón del carrito */}
              <CartButton onClick={() => setIsCartOpen(true)} />

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Mostrar login/registro o usuario */}
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {t('welcome', { name: user.firstName })}
                  </span>
                  <button
                    onClick={logout}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile: Cart and Menu Toggle — ocultos cuando búsqueda activa */}
            {!isMobileSearchActive && (
              <div className="flex md:hidden items-center gap-2 flex-shrink-0">
                <CartButton onClick={() => setIsCartOpen(true)} />
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                  aria-label={t('menu', { defaultValue: 'Menú' })}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-slate-800 py-4">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/productos"
                  className="text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('products')}
                </Link>

                <Link
                  href="/about"
                  className="text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('about')}
                </Link>

                {/* Language Switcher */}
                <div className="py-2">
                  <LanguageSwitcher />
                </div>

                <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                  {user ? (
                    <div className="flex flex-col space-y-3">
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {t('welcome', { name: user.firstName })}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-left text-gray-700 hover:text-blue-600 font-medium py-2"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-blue-600 font-medium py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/register"
                        className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('register')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
