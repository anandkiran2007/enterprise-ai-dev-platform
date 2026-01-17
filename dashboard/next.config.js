/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    // In Docker with nginx, use relative paths (nginx handles routing)
    // NEXT_PUBLIC_USE_RELATIVE_PATHS tells the client to use relative paths
    NEXT_PUBLIC_USE_RELATIVE_PATHS: process.env.NEXT_PUBLIC_USE_RELATIVE_PATHS || 'true',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
  async rewrites() {
    // In Docker, nginx handles routing, so rewrites are only for standalone dev
    // When NEXT_PUBLIC_USE_RELATIVE_PATHS is true, client uses relative paths
    // When false, proxy through Next.js server
    const useRelativePaths = process.env.NEXT_PUBLIC_USE_RELATIVE_PATHS !== 'false'
    
    if (useRelativePaths) {
      // No rewrites needed - client will use relative paths, nginx will proxy
      return []
    }
    
    // Fallback: proxy through Next.js (for standalone dev without nginx)
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;