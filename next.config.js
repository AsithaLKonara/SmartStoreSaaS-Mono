/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@panva/oidc',
      'openid-client',
      'oauth',
      '@prisma/client',
      'jose'
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    return config
  }
}

module.exports = nextConfig; // DEV SERVER RESTART TRIGGER