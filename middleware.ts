import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Helper function to verify JWT and extract role
async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const { payload } = await jwtVerify(token, secret);
    return (payload.role as string) || null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Helper function to check if role can access route
function canRoleAccessRoute(role: string, pathname: string): boolean {
  // Define protected routes for ADMIN only
  // Tiene que estar acá TODA ruta de sólo-admin. Lo que falte de esta lista se
  // atajaba únicamente desde el cliente —el layout mira el rol y redirige—, y
  // eso no es una defensa: basta con desactivar el JavaScript, o llegar a la
  // ruta antes de que el layout resuelva, para verla.
  const adminOnlyRoutes = [
    '/admin/dashboard/productos',
    '/admin/dashboard/categories',
    '/admin/dashboard/banners',
    '/admin/dashboard/clientes',
    '/admin/dashboard/cupones',
    '/admin/dashboard/api-keys',
    '/admin/dashboard/usuarios',
    '/admin/dashboard/api-logs',
    '/admin/dashboard/audit-logs',
    '/admin/dashboard/invitaciones',
  ];

  // ORDER_ADMIN can access orders and dashboard
  const orderAdminRoutes = [
    '/admin/dashboard',
    '/admin/dashboard/ordenes',
  ];

  if (role === 'admin') {
    // Admin has access to everything
    return true;
  }

  if (role === 'order_admin') {
    // Check if trying to access admin-only route
    for (const route of adminOnlyRoutes) {
      if (pathname.startsWith(route)) {
        return false;
      }
    }
    // Check if trying to access allowed routes
    for (const route of orderAdminRoutes) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return true;
      }
    }
    // Deny access to other admin routes
    return false;
  }

  // Regular users cannot access admin panel
  return false;
}

// Get default redirect path based on role
function getDefaultPath(role: string): string {
  if (role === 'admin') {
    return '/admin/dashboard';
  }
  if (role === 'order_admin') {
    return '/admin/dashboard/ordenes';
  }
  if (role === 'customer') {
    return '/';
  }
  return '/';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes authentication and authorization
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;

    // Redirect /admin root to appropriate page
    if (pathname === '/admin') {
      if (token) {
        const role = await verifyToken(token);
        if (role) {
          const defaultPath = getDefaultPath(role);
          return NextResponse.redirect(new URL(defaultPath, request.url));
        }
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Allow access to login page
    if (pathname === '/admin/login') {
      // If already logged in with valid token, redirect to appropriate dashboard
      if (token) {
        const role = await verifyToken(token);
        if (role) {
          const defaultPath = getDefaultPath(role);
          return NextResponse.redirect(new URL(defaultPath, request.url));
        }
      }
      return NextResponse.next();
    }

    // For all other admin routes, require authentication
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify token and check role-based access
    const role = await verifyToken(token);

    if (!role) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check if role can access this route
    if (!canRoleAccessRoute(role, pathname)) {
      // Redirect to appropriate dashboard based on role
      const defaultPath = getDefaultPath(role);
      return NextResponse.redirect(new URL(defaultPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
