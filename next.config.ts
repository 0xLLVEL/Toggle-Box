import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* ─── Feature flags ─────────────────────────────────────── */
  reactStrictMode: true,

  /* ─── Image optimisation ─────────────────────────────────── */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/**',
      },
    ],
  },

  /* ─── Custom headers ─────────────────────────────────────── */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
