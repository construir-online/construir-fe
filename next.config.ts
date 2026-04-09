import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'congress-marketing.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/banners/**',
      },
      {
        protocol: 'https',
        hostname: 'congress-marketing.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: 'congress-marketing.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/categories/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
