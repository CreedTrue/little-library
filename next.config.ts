import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "imgs.search.brave.com",
      },
    ],
  },
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
