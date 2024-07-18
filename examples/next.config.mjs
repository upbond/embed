/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    url: process.env.NEXT_PUBLIC_URL,
  },
  output: 'export',
  distDir: 'build',
  trailingSlash: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
