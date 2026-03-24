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