/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
  // Prevent Next.js from issuing trailing-slash redirects before route handlers run.
  // The catch-all proxy at app/api/v1/[...path]/route.ts handles /api/v1/* traffic
  // and follows FastAPI's own redirect_slashes internally (server-to-server).
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
