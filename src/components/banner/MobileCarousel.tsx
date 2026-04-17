'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Banner } from '@/types';
import BannerSlide from './BannerSlide';

import 'swiper/css';

interface MobileCarouselProps {
  banners: Banner[];
}

export default function MobileCarousel({ banners }: MobileCarouselProps) {
  return (
    <div className="relative z-0">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1.15}
        centeredSlides={true}
        spaceBetween={12}
        initialSlide={0}
        loop={true}
        onSwiper={(swiper) => {
          requestAnimationFrame(() => swiper.slideToLoop(0, 0, false));
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        speed={500}
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.uuid} className="h-[400px] rounded-2xl overflow-hidden">
            <BannerSlide banner={banner} isPriority={index === 0} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
