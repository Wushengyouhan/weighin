import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 添加空的 turbopack 配置以兼容 Turbopack
  turbopack: {},
  // 保留 webpack 配置作为备用
  webpack: (config, { isServer }) => {
    // 确保某些 Node.js 模块只在服务端运行
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
