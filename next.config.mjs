import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
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

if (
  process.env.NODE_ENV === "development" &&
  process.env.OPENNEXT_ENABLE_CLOUDFLARE_DEV === "1"
) {
  import("@opennextjs/cloudflare")
    .then(async ({ initOpenNextCloudflareForDev }) => {
      await initOpenNextCloudflareForDev();
    })
    .catch((error) => {
      console.warn(
        "[next.config] Failed to initialize OpenNext Cloudflare dev bindings:",
        error,
      );
    });
}
