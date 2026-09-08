'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { authService } from '@/services/auth';
import { canAccessRoute, getDefaultAdminPath } from '@/lib/permissions';
import {
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  ShoppingCart,
  FolderTree,
  Tag,
  Menu,
  X,
  LogOut,
  Key,
  ShieldAlert,
  Users,
  FileText,
  HelpCircle,
  Mail,
  ClipboardList,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const t = useTranslations('nav');

  useEffect(() => {
    // Antes esto sacaba el token y el perfil de `localStorage`. Ninguno de los
    // dos está ahí ya: el token vive en una cookie `httpOnly` que este código
    // no puede leer, y el perfil se le pregunta al servidor. De paso deja de
    // haber un `role` guardado en el navegador, que cualquiera podía editar a
    // mano para que le apareciera el menú completo.
    let vigente = true;

    authService
      .getProfile()
      .then((perfil: User) => {
        if (!vigente) return;
        setUser(perfil);

        // Check if user has permission to access current route
        if (!canAccessRoute(perfil.role, pathname)) {
          setAccessDenied(true);

          // Redirect to appropriate page based on role
          const defaultPath = getDefaultAdminPath(perfil.role);
          if (pathname !== defaultPath) {
            router.push(defaultPath);
          }
        }
      })
      .catch(() => {
        // Sin sesión válida. El `middleware.ts` ya debería haber atajado esto
        // leyendo la cookie en el servidor; esto es la segunda línea, para el
        // caso de una cookie que venció con la pestaña abierta.
        if (vigente) router.push('/admin/login');
      });

    return () => {
      vigente = false;
    };
  }, [router, pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setAccessDenied(false); // Reset access denied when changing routes
  }, [pathname]);

  const handleLogout = async () => {
    // La cookie es `httpOnly`, así que el `document.cookie` que había acá ya no
    // la borra: tiene que hacerlo el servidor. Sin esto, "cerrar sesión"
    // limpiaba la pantalla pero la sesión seguía viva en el navegador.
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      router.push('/admin/login');
    }
  };

  if (!user) {
    return null;
  }

  // Define navigation links with roles that can access them
  const allNavLinks = [
    {
      href: '/admin/dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      exact: true,
      roles: [UserRole.ADMIN, UserRole.ORDER_ADMIN] // Both can see dashboard
    },
    {
      href: '/admin/dashboard/productos',
      label: t('products'),
      icon: Package,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/banners',
      label: t('banners'),
      icon: ImageIcon,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/ordenes',
      label: t('orders'),
      icon: ShoppingCart,
      roles: [UserRole.ADMIN, UserRole.ORDER_ADMIN]
    },
    // Clientes removed - ORDER_ADMIN has NO access to customers
    {
      href: '/admin/dashboard/categories',
      label: t('categories'),
      icon: FolderTree,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/cupones',
      label: t('coupons'),
      icon: Tag,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/api-keys',
      label: t('apiKeys'),
      icon: Key,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/api-logs',
      label: t('apiLogs'),
      icon: FileText,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/audit-logs',
      label: t('auditLogs'),
      icon: ClipboardList,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/usuarios',
      label: t('users'),
      icon: Users,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/invitaciones',
      label: 'Invitaciones',
      icon: Mail,
      roles: [UserRole.ADMIN]
    },
    {
      href: '/admin/dashboard/ayuda',
      label: 'Ayuda',
      icon: HelpCircle,
      roles: [UserRole.ADMIN, UserRole.ORDER_ADMIN]
    },
  ];

  // Filter navigation based on user role
  const navLinks = allNavLinks.filter(link =>
    link.roles.includes(user.role)
  );

  // Role badge component
  const getRoleBadge = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            <ShieldAlert className="w-3 h-3" />
            Admin
          </span>
        );
      case UserRole.ORDER_ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
            <ShieldAlert className="w-3 h-3" />
            Gestor de Pedidos
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <Image
              src="/construir-logo.png"
              alt="Construir Logo"
              width={120}
              height={32}
              className="sm:w-[150px] sm:h-[40px]"
              priority
            />
            <span className="hidden sm:block text-sm text-gray-500">{t('adminPanel')}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Role badge - hidden on small screens */}
            <div className="hidden lg:block">
              {getRoleBadge()}
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              {/* Show role badge on mobile below name */}
              <div className="lg:hidden">
                {getRoleBadge()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        {/* Overlay - Mobile Only */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-[57px] sm:top-[65px] h-[calc(100vh-57px)] sm:h-[calc(100vh-65px)]
            bg-white shadow-lg md:shadow-sm
            w-64 z-40
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Close Button - Mobile Only */}
          <div className="md:hidden flex justify-end p-4 border-b">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-h-[calc(100vh-57px)] sm:min-h-[calc(100vh-65px)] w-full max-w-full overflow-x-hidden">
          {/* Access denied message */}
          {accessDenied && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Acceso Restringido</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    No tienes permisos para acceder a esta sección. Has sido redirigido a una página autorizada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
