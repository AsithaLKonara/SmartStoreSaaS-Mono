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
  webpack: (config) => {
    return config
  }
}

module.exports = nextConfig