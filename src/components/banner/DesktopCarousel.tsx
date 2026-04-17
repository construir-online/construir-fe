'use client';

import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { SwiperRef } from 'swiper/react';
import type { Banner } from '@/types';
import BannerSlide from './BannerSlide';
import CarouselControls from './CarouselControls';
import CarouselDots from './CarouselDots';
import 'swiper/css';

interface DesktopCarouselProps {
  banners: Banner[];
}

export default function DesktopCarousel({ banners }: DesktopCarouselProps) {
  const swiperRef = useRef<SwiperRef>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => swiperRef.current?.swiper.slideNext();
  const goToPrevious = () => swiperRef.current?.swiper.slidePrev();
  const goToSlide = (i: number) => swiperRef.current?.swiper.slideToLoop(i);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gray-900 overflow-hidden shadow-2xl z-0">
      <Swiper
        ref={swiperRef}
        modules={[Autoplay]}
        slidesPerView={1}
        initialSlide={0}
        loop={banners.length > 1}
        loopAdditionalSlides={banners.length}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        speed={500}
        className="w-full h-full"
        onRealIndexChange={(swiper) => setCurrentIndex(swiper.realIndex)}
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.uuid} className="h-full">
            <BannerSlide banner={banner} isPriority={index === 0} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none z-20" />

      {banners.length > 1 && (
        <>
          <CarouselControls onPrevious={goToPrevious} onNext={goToNext} />
          <CarouselDots
            total={banners.length}
            currentIndex={currentIndex}
            onSelect={goToSlide}
          />
        </>
      )}
    </div>
  );
}
