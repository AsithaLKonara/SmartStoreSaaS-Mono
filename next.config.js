/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@panva/oidc',
      'openid-client',
      'oauth',
      '@prisma/client'
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize ESM packages for server-side (Node runtime only, NOT edge)
      config.externals = config.externals || [];
      config.externals.push({
        'openid-client': 'commonjs openid-client',
        'oauth': 'commonjs oauth',
        '@panva/oidc': 'commonjs @panva/oidc'
      });
    }
    return config
  }
}

module.exports = nextConfig