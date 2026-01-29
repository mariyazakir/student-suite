/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
  // Removed turbopack.root to avoid conflict with Vercel's outputFileTracingRoot
};

module.exports = nextConfig;
