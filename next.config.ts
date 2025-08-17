import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const nextConfig: NextConfig = {
  // Unblock Cloudflare builds that fail on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Keep TS errors as blocking. Flip to true only if TS errors also block you.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize for Cloudflare Pages deployment
  experimental: {
    cssChunking: 'strict',
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.bcbits.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bcbits.com',
        port: '',
        pathname: '/**',
      },
      // Allow common image hosting services
      {
        protocol: 'https',
        hostname: 'imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

export default nextConfig;
