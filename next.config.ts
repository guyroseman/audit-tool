import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode for better error detection in dev
  reactStrictMode: true,
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;
