/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
    ],
  },
}

module.exports = {
  images: {
    domains: ['api.dicebear.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};