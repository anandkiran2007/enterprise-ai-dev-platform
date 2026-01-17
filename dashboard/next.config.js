/** @type {import('next').NextConfig} */
const isDocker = typeof process !== 'undefined' && !!process.env.HOSTNAME && /^[0-9a-f]{12}$/.test(process.env.HOSTNAME)
const defaultApiUrl = isDocker ? 'http://api:8000' : 'http://localhost:8000'
const defaultWsUrl = isDocker ? 'ws://api:8000' : 'ws://localhost:8000'

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || defaultApiUrl,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl,
  },
  async rewrites() {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;