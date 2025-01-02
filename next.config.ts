/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      '3uauddgaumtivfns.public.blob.vercel-storage.com'  // Vercel Blob 스토리지 도메인
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;