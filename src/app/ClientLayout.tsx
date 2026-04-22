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
  const isCheckoutRoute = pathname?.startsWith('/checkout');
  const showBottomNav = !isAdminRoute && !isCheckoutRoute;
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
      {!isAdminRoute && <Navbar />}
      <main className={`min-h-screen${showBottomNav ? ' pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      {!isAdminRoute && <div className="hidden md:block"><Footer /></div>}
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
