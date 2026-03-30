"use client";

import BannerCarousel from "@/components/banner/BannerCarousel";
import FeaturedCategories from "@/components/FeaturedCategories";
import FeaturedProducts from "@/components/FeaturedProducts";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Banner Carousel - spacing condicional */}
      <div className="pt-4 md:pt-0 mb-8 sm:mb-0 relative z-0">
        <BannerCarousel />
      </div>

      {/* Featured Products - overlap solo en desktop */}
      <div className="sm:-mt-20">
        <FeaturedProducts />
      </div>

      {/* Featured Categories */}
      <FeaturedCategories />
    </div>
  );
}
