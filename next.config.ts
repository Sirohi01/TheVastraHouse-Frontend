import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

// The platform's production hostname would otherwise serve a duplicate copy of the site.
const PLATFORM_HOST = "the-vastra-house-frontend.vercel.app";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const redirectPlatformHost = Boolean(siteUrl && new URL(siteUrl).hostname !== PLATFORM_HOST);

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  outputFileTracingRoot: appDir,
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return redirectPlatformHost
      ? [
          {
            destination: `${siteUrl}/:path*`,
            has: [{ type: "host" as const, value: PLATFORM_HOST }],
            permanent: true,
            source: "/:path*",
          },
        ]
      : [];
  },
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
