/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: true,
  },
  transpilePackages: [
    '@rainbow-me/rainbowkit',
    'wagmi',
    'viem',
    '@reown/appkit'
  ],

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore problematic worker files during build
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: 'null-loader',
    });

    // Handle ESM modules
    config.externals = config.externals || [];
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    // Fix for Node.js modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Disable optimization for problematic files
    config.optimization = {
      ...config.optimization,
      minimizer: config.optimization.minimizer.map((minimizer) => {
        if (minimizer.options && minimizer.options.terserOptions) {
          minimizer.options.terserOptions.format = {
            ...minimizer.options.terserOptions.format,
            comments: false,
          };
          minimizer.options.terserOptions.compress = {
            ...minimizer.options.terserOptions.compress,
            drop_console: false,
          };
        }
        return minimizer;
      }),
    };

    return config;
  },
  env: {
    CUSTOM_KEY: 'drems-platform',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 