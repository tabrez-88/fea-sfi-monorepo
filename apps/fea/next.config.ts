import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sfi-fea/shared'],
  experimental: {
    // Enable typed routes (optional)
    typedRoutes: true,
  },
};

export default nextConfig;
