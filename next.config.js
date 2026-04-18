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

  // Security headers + Link headers for agent discovery
  async headers() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitaktracker.com';
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
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              `<${baseUrl}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
              `<${baseUrl}/.well-known/openapi.json>; rel="service-desc"; type="application/openapi+json"`,
              `<${baseUrl}/api-docs>; rel="service-doc"; type="text/html"`,
              `<${baseUrl}/llms.txt>; rel="llms-txt"; type="text/plain"`,
              `<${baseUrl}/.well-known/ai-plugin.json>; rel="ai-plugin"; type="application/json"`,
              `<${baseUrl}/.well-known/agent-skills>; rel="agent-skills"; type="application/json"`,
              `<${baseUrl}/.well-known/mcp/server-card.json>; rel="mcp-server"; type="application/json"`,
              `<${baseUrl}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"; type="application/json"`,
            ].join(', '),
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
    ];
  },
};

module.exports = nextConfig;