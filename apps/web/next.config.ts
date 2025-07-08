import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["avatars.githubusercontent.com", "images.unsplash.com"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        child_process: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        querystring: false,
      };
    }
    return config;
  },
};

export default nextConfig;
