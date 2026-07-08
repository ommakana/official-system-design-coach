/** @type {import('next').NextConfig} */
const nextConfig = {
  // API routes need server rendering — no static export
  reactStrictMode: true,
  compress: true,          // gzip responses (Vercel handles brotli at edge)
  poweredByHeader: false,  // don't leak Next.js version in response headers

  // Security headers on every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
