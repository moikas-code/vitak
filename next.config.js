/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  compress: true,

  // Optimize large library imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },

  // Only run ESLint on source directories
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Map .well-known JSON endpoints (Next.js can't have dots in dir names)
  async rewrites() {
    return [
      {
        source: '/.well-known/ai-plugin.json',
        destination: '/.well-known/ai-plugin',
      },
      {
        source: '/.well-known/openapi.json',
        destination: '/.well-known/openapi',
      },
      {
        source: '/.well-known/agent-skills/index.json',
        destination: '/.well-known/agent-skills',
      },
      {
        source: '/.well-known/mcp/server-card.json',
        destination: '/.well-known/mcp/server-card',
      },
      {
        source: '/.well-known/openid-configuration',
        destination: '/.well-known/openid-configuration',
      },
    ];
  },
};

module.exports = nextConfig;