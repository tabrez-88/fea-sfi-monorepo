import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output — required for Docker/Cloud Run deployment.
  // Produces a self-contained bundle under .next/standalone that includes
  // only the files needed to run the app (no full node_modules needed).
  output: 'standalone',
  // Note: `typedRoutes` is intentionally OFF — many ROUTES entries point to
  // pages we haven't built yet (deals, settlements, etc.) and the typed-routes
  // codegen rejects any href that doesn't have a matching `page.tsx`. We'll
  // re-enable once every route in `constants/routes.ts` has a real page.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
