import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

// The platform's production hostname would otherwise serve a duplicate copy of the site.
const PLATFORM_HOST = "the-vastra-house-frontend.vercel.app";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const redirectPlatformHost = Boolean(siteUrl && new URL(siteUrl).hostname !== PLATFORM_HOST);

const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

/**
 * Full policy is report-only: it is built from the third parties the storefront is known to use
 * (Cloudinary, GA4, Razorpay, Instagram embeds) and should be watched in browser consoles for a
 * release before being switched to enforcing. Only `frame-ancestors` is enforced today.
 * HSTS is intentionally NOT set here: it is managed at the Cloudflare edge.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://www.instagram.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.google-analytics.com https://www.googletagmanager.com https://*.cdninstagram.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://api.razorpay.com https://lumberjack.razorpay.com https://api.postalpincode.in`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.instagram.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  outputFileTracingRoot: appDir,
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ headers: securityHeaders, source: "/:path*" }];
  },
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
