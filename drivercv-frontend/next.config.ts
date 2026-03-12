/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

const nextConfig = {
  async rewrites() {
    return [
      // Frontend'den gelen tüm /api/* çağrılarını backend'e aktar
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_BASE}/uploads/:path*`,
      },
    ];
  },
  // Production optimizasyonları
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
