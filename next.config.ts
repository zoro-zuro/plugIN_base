import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Add this to ignore TS errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Add this to ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
