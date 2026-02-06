/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Frontend'den gelen tüm /api/* çağrılarını backend'e aktar
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3001/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
