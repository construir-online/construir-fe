'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2X2, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const { user } = useAuth();

  const totalItems = getTotalItems();
  const accountHref = '/mi-cuenta';


  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname?.startsWith(path) ?? false;

  const tabCls = (active: boolean) =>
    `flex flex-col items-center gap-0.5 py-2 flex-1 transition-colors ${
      active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {/* Inicio */}
          <Link href="/" className={tabCls(isActive('/'))}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Inicio</span>
          </Link>

          {/* Productos */}
          <Link href="/productos" className={tabCls(isActive('/productos'))}>
            <Grid2X2 className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Productos</span>
          </Link>

          {/* Categorías */}
          <Link href="/categorias" className={tabCls(isActive('/categorias'))}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Categorías</span>
          </Link>

          {/* Carrito */}
          <Link href="/carrito" className={tabCls(isActive('/carrito'))}>
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">Carrito</span>
          </Link>

          {/* Cuenta */}
          <Link
            href={accountHref}
            className={tabCls(isActive('/mi-cuenta'))}
          >
            {user ? (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold select-none">
                {user.firstName?.[0]?.toUpperCase() ?? '?'}
              </span>
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium leading-none">Cuenta</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
