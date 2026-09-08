"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/cart/CartDrawer";
import { ToastProvider } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { initGA, trackPageView } from "@/lib/analytics";
import { analyticsService } from "@/services/analytics";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  // Las pantallas de acceso llevan su propia cabecera de marca a pantalla completa
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(
    (route) => pathname?.startsWith(route)
  );
  // El diseño móvil deja estas pantallas a pantalla completa: traen su propia
  // cabecera con botón de volver, así que no llevan navbar ni navegación inferior
  const isMobileFullscreenRoute = ['/productos', '/carrito', '/checkout'].some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );
  const showChrome = !isAdminRoute && !isAuthRoute;
  const showBottomNav = showChrome && !isMobileFullscreenRoute;
  const { isCartOpen, closeCart } = useCart();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track route changes
  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
    // Sin `navigator.userAgent`: el backend dejó de guardarlo y, como valida
    // con `forbidNonWhitelisted`, mandarlo ahora devuelve un 400 y la visita se
    // perdería en silencio. El `referrer` sí va entero y lo recorta el backend
    // a su origen, que es donde vive esa regla.
    analyticsService.trackPageView({
      path: pathname,
      title: document.title,
      referrer: document.referrer,
    });
  }, [pathname]);

  return (
    <>
      {showChrome &&
        (isMobileFullscreenRoute ? (
          <div className="hidden md:block">
            <Navbar />
          </div>
        ) : (
          <Navbar />
        ))}
      <main className={`min-h-screen${showBottomNav ? ' pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      {showChrome && <div className="hidden md:block"><Footer /></div>}
      {showBottomNav && <BottomNav />}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <LayoutContent>{children}</LayoutContent>
    </ToastProvider>
  );
}
