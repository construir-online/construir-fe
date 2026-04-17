'use client';

import { useState, useEffect } from 'react';
import { getActiveBanners } from '@/services/banners';
import type { Banner } from '@/types';
import MobileCarousel from './MobileCarousel';
import DesktopCarousel from './DesktopCarousel';

interface BannerCarouselProps {
  className?: string;
}

export default function BannerCarousel({ className }: BannerCarouselProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Detectar viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    setIsMounted(true);

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true);
        const data = await getActiveBanners();
        setBanners(data);
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Evitar hydration mismatch
  if (!isMounted || loading || banners.length === 0) {
    return (
      <div className={className}>
        <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={className}>
      {isMobile ? (
        <MobileCarousel banners={banners} />
      ) : (
        <DesktopCarousel banners={banners} />
      )}
    </div>
  );
}
