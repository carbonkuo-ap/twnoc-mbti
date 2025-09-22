const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 靜態導出配置 (Next.js 13+)
  output: 'export',

  // GitHub Pages specific configuration
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/twnoc-mbti') : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/twnoc-mbti') : '',
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  webpack: (config) => {
    return config;
  },

  // 針對 GitHub Pages 的環境變數處理
  env: {
    NEXT_PUBLIC_ENCRYPTION_KEY: process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
    NEXT_PUBLIC_ADMIN_HASH: process.env.NEXT_PUBLIC_ADMIN_HASH,
    NEXT_PUBLIC_ADMIN_SALT: process.env.NEXT_PUBLIC_ADMIN_SALT,
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/twnoc-mbti') : '',
  }
};

module.exports = nextConfig;
