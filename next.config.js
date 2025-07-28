/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // External packages configuration
  serverExternalPackages: ['pg-boss', 'tesseract.js'],
  
  // Output configuration для Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Compression и optimization
  compress: true,
  poweredByHeader: false,
  
  // Security headers
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { isServer }) => {
    // Фикс для Tesseract.js в Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        net: false,
        tls: false,
      };
    }
    
    // Отключаем canvas для serverless окружения
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };

    // Исключения для Node.js модулей на клиенте
    config.externals = config.externals || [];
    if (!Array.isArray(config.externals)) {
      config.externals = [config.externals];
    }
    
    // Исключаем проблематичные модули
    config.externals.push({ 
      'pdf-parse': 'commonjs pdf-parse',
      'child_process': 'commonjs child_process',
      'node:child_process': 'commonjs child_process'
    });
    
    return config;
  },
  
  serverExternalPackages: ['tesseract.js'],
};

module.exports = nextConfig; 