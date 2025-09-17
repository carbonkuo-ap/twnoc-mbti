/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: '/twnoc-mbti',
  assetPrefix: '/twnoc-mbti/',
}

module.exports = nextConfig
