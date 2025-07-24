/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Фикс для Tesseract.js в Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Отключаем canvas для serverless окружения
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    
    // Исключаем pdf-parse из бандла и загружаем как external (runtime require)
    if (!config.externals) {
      config.externals = [];
    }
    // Если externals ранее был функцией или объектом, приводим к массиву для push
    if (!Array.isArray(config.externals)) {
      config.externals = [config.externals];
    }
    config.externals.push({ 'pdf-parse': 'commonjs pdf-parse' });
    
    return config;
  },
  
  serverExternalPackages: ['tesseract.js'],
};

module.exports = nextConfig; 