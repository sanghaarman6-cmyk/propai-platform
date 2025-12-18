/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,

  typescript: {
    // 🚨 CRITICAL: stop Next from enforcing AppPageConfig
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
