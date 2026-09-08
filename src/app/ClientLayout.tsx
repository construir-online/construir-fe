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
  // El pie se ve en móvil sólo donde hay cromo; en las pantallas completas sigue
  // siendo de escritorio (`hidden md:block`)
  const showFooter = showChrome && !isMobileFullscreenRoute;
  const { isCartOpen, closeCart } = useCart();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track route changes
  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
    analyticsService.trackPageView({
      path: pathname,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
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
      {/* El colchón que separa el contenido de la barra inferior pasa al final del
          pie cuando el pie se muestra; dejarlo también aquí abría una franja
          blanca entre el contenido y el pie. La condición queda por si alguna vez
          hay barra inferior sin pie debajo: entonces el hueco lo pone `main`. */}
      <main className={`min-h-screen${showBottomNav && !showFooter ? ' pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      {/* El pie llevaba `hidden md:block`, así que en el teléfono no existía en
          ninguna ruta, y con él desaparecían los únicos enlaces a contacto y a las
          páginas legales: quien compra desde el móvil no tenía forma de llegar a
          /contact, /about, /terms ni /privacy. Ahora se muestra en las rutas
          normales; en las de pantalla completa (productos, carrito, checkout) se
          mantiene oculto porque ese diseño quita el cromo a propósito. */}
      {showChrome &&
        (showFooter ? (
          /* La barra inferior es fija y el pie va después de `main`: sin este
             colchón tapaba el copyright y los enlaces legales, justo lo que
             veníamos a rescatar. Va en un envoltorio del color del pie para que
             no se vea una franja clara bajo él. */
          <div className="bg-brand-900 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Footer />
          </div>
        ) : (
          <div className="hidden md:block">
            <Footer />
          </div>
        ))}
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
