import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['localhost', '127.0.0.1', '*.e2b.app'],
  poweredByHeader: false,
};

export default nextConfig;
