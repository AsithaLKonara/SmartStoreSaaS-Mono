/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@panva/oidc',
      'openid-client',
      'jose',
      'oauth',
      '@prisma/client'
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize ESM packages for server-side
      config.externals = config.externals || [];
      config.externals.push({
        'openid-client': 'commonjs openid-client',
        'jose': 'commonjs jose',
        'oauth': 'commonjs oauth',
        '@panva/oidc': 'commonjs @panva/oidc'
      });
    }
    return config
  }
}

module.exports = nextConfig