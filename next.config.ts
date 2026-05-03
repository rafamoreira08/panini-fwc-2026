import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  basePath: '',
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force Firebase to use browser bundles (HTTP) instead of Node.js bundles (gRPC)
      // The Node.js bundle uses gRPC which fails silently in Server Actions
      config.resolve.alias = {
        ...config.resolve.alias,
        '@firebase/firestore': path.resolve(
          __dirname,
          'node_modules/@firebase/firestore/dist/index.esm2017.js'
        ),
      }
    }
    return config
  },
}

export default nextConfig
