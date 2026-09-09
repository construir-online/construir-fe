'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute, getDefaultAdminPath } from '@/lib/permissions';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: boolean;
}

/**
 * Component for client-side permission protection
 *
 * @param children - Content to protect
 * @param fallback - What to show if user doesn't have permission
 * @param redirect - Whether to redirect automatically to appropriate page
 */
export function PermissionGuard({
  children,
  fallback,
  redirect = false
}: PermissionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // El rol sale del contexto, que lo trae de `/auth/profile`. Antes salía de
  // `localStorage['user']`: como ya nadie escribe esa clave, este guard le
  // habría denegado el acceso a TODO el mundo en cuanto alguien lo montara.
  const { user, loading } = useAuth();

  const hasPermission = user ? canAccessRoute(user.role, pathname) : false;

  useEffect(() => {
    if (loading || !user || hasPermission || !redirect) return;
    router.push(getDefaultAdminPath(user.role));
  }, [loading, user, hasPermission, redirect, router]);

  // Mientras no se sepa si hay sesión no se decide nada: dar por denegado el
  // rato de carga hacía parpadear "Acceso Denegado" a quien sí tiene permiso.
  if (loading) {
    return null;
  }

  // No permission
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-danger-50 border border-danger-100 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-danger-700">Acceso Denegado</h3>
            <p className="text-sm text-danger-700 mt-1">
              No tienes permisos para acceder a esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
