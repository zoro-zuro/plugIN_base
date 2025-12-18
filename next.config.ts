import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... your other config

  experimental: {
    serverActions: {
      // Increase limit to 10MB (or whatever your max file size is)
      bodySizeLimit: "10mb",
    },
  },

  // Keep your existing webpack config for FastEmbed/etc if you have it
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
