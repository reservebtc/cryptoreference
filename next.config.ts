import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force trailing slash consistency (no trailing slash)
  trailingSlash: false,
  
  // Skip trailing slash redirect during build
  skipTrailingSlashRedirect: false,

  // Redirects configuration
  async redirects() {
    return [
      // Redirect www to non-www (Fix: Canonical issue)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.cryptoreference.io',
          },
        ],
        destination: 'https://cryptoreference.io/:path*',
        permanent: true, // 301 redirect
      },
      // Redirect HTTP to HTTPS (already handled by Vercel, but explicit is better)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'cryptoreference.io',
          },
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://cryptoreference.io/:path*',
        permanent: true,
      },
    ];
  },

  // Headers configuration for better SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;