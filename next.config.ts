// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // ✅ Add empty turbopack config to silence warning
  turbopack: {},

  // ✅ For production builds, use webpack config
  webpack: (config, { isServer }) => {
    // Existing fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Handle native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        sharp: "commonjs sharp",
        canvas: "commonjs canvas",
        "@xenova/transformers": "commonjs @xenova/transformers",
      });
    }

    return config;
  },
};

export default nextConfig;
