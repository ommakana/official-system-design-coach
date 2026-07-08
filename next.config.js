/** @type {import('next').NextConfig} */
const nextConfig = {
  // No output:'export' — we need API routes for Gemini streaming
  reactStrictMode: true,
};

module.exports = nextConfig;
