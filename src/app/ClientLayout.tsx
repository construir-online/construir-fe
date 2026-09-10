"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/cart/CartDrawer";
import CartSummaryBar from "@/components/cart/CartSummaryBar";
import {
  CLASE_HUECO_PIE_NAV_Y_CARRITO,
  CLASE_HUECO_PIE_SOLO_NAV,
  esRutaDeCatalogo,
} from "@/components/cart/barras-fijas";
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
  // La barra inferior y el pie en móvil van siempre juntos: donde hay cromo y no
  // es pantalla completa se ven los dos, y en las pantallas completas ninguno.
  // Es una sola condición a propósito; el colchón que separa el contenido de la
  // barra depende de eso (ver más abajo).
  const showMobileChrome = showChrome && !isMobileFullscreenRoute;
  const { isCartOpen, closeCart, getTotalItems } = useCart();

  // La barra flotante de carrito acompaña mientras se recorre el catálogo. El
  // listado la pinta él mismo — allí no hay ni pie ni navegación inferior —; acá
  // se añade a las pantallas que sí llevan cromo, que son justo las que tienen
  // riesgo de solape.
  const conBarraDeCarrito =
    showMobileChrome && esRutaDeCatalogo(pathname) && getTotalItems() > 0;

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
      {/* `main` ya no lleva colchón inferior: siempre que hay barra inferior hay
          pie debajo, y es el pie el que deja el hueco. Ponerlo también aquí abría
          una franja blanca entre el contenido y el pie. Si alguna vez la barra
          apareciera sin pie debajo, el hueco habría que devolverlo aquí. */}
      <main className="min-h-screen">
        {children}
      </main>
      {/* El pie llevaba `hidden md:block`, así que en el teléfono no existía en
          ninguna ruta, y con él desaparecían los únicos enlaces a contacto y a las
          páginas legales: quien compra desde el móvil no tenía forma de llegar a
          /contact, /about, /terms ni /privacy. Ahora se muestra en las rutas
          normales; en las de pantalla completa (productos, carrito, checkout) se
          mantiene oculto porque ese diseño quita el cromo a propósito. */}
      {showChrome &&
        (showMobileChrome ? (
          /* La barra inferior es fija y el pie va después de `main`: sin este
             colchón tapaba el copyright y los enlaces legales, justo lo que
             veníamos a rescatar. Va en un envoltorio del color del pie para que
             no se vea una franja clara bajo él. */
          <div
            className={`bg-brand-900 ${
              conBarraDeCarrito
                ? CLASE_HUECO_PIE_NAV_Y_CARRITO
                : CLASE_HUECO_PIE_SOLO_NAV
            }`}
          >
            <Footer />
          </div>
        ) : (
          <div className="hidden md:block">
            <Footer />
          </div>
        ))}
      {showMobileChrome && <BottomNav />}
      {/* Encima de la navegación inferior, nunca sobre ella: ver `barras-fijas.ts`. */}
      {conBarraDeCarrito && <CartSummaryBar sobreBarraInferior />}
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
