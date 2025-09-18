const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // GitHub Pages specific configuration
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/twnoc-mbti') : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/twnoc-mbti') + '/' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  webpack: (config, { dev, isServer }) => {
    // 只在生產環境且為客戶端建構時啟用程式碼混淆
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator({
          // 混淆選項
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: true,
          debugProtectionInterval: 4000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: true,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 5,
          stringArray: true,
          stringArrayCallsTransform: true,
          stringArrayEncoding: ['base64'],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 2,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 4,
          stringArrayWrappersType: 'function',
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,

          // 排除不需要混淆的檔案
          excludes: [
            'node_modules/**',
            'static/**',
            '**/*.css',
            '**/*.scss',
            '**/*.sass',
            '**/*.less'
          ],

          // 保留某些函數名稱不被混淆（避免框架問題）
          reservedNames: [
            '__next*',
            '__webpack*',
            'webpackChunkName',
            '_app',
            '_document',
            'getStaticProps',
            'getStaticPaths',
            'getServerSideProps'
          ]
        }, [
          // 排除特定的 bundle
          'static/chunks/framework-*.js',
          'static/chunks/main-*.js',
          'static/chunks/pages/_app-*.js'
        ])
      );
    }

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
