/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false,
  webpack: (config, { dev }) => {
    // Disable webpack filesystem cache to avoid EAGAIN readdir errors in sandbox
    config.cache = false;
    // Reduce parallelism to minimize concurrent filesystem operations
    config.parallelism = 1;
    return config;
  },
};

module.exports = nextConfig;
