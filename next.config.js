/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@panva/oidc',
      'openid-client',
      'jose',
      'oauth'
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize these packages for server-side
      config.externals = config.externals || []
    }
    return config
  }
}

module.exports = nextConfig