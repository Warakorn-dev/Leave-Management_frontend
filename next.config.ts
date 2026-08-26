import type { NextConfig } from "next";

const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '').replace(/\/api$/, '');

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BACKEND_URL && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('Set NEXT_PUBLIC_BACKEND_URL (or NEXT_PUBLIC_API_URL) to the deployed backend URL before building for production.');
}

const nextConfig: NextConfig = {
  // Allows CI or a verification build to use an isolated generated-output directory.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  devIndicators: false,
  allowedDevOrigins: ['192.168.24.79', '192.168.24.134', 'localhost', '127.0.0.1'],
  async rewrites() {
    return {
      // beforeFiles: run BEFORE file-system checks
      // These rewrites run first; if no match, Next.js serves its own routes
      beforeFiles: [],
      // afterFiles: run AFTER file-system checks (Next.js routes take priority)
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
