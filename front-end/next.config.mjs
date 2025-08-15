/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    ASGARDEO_CLIENT_ID: process.env.ASGARDEO_CLIENT_ID,
    ASGARDEO_CLIENT_SECRET: process.env.ASGARDEO_CLIENT_SECRET,
    ASGARDEO_BASE_URL: process.env.ASGARDEO_BASE_URL,
    ASGARDEO_REDIRECT_URI: process.env.ASGARDEO_REDIRECT_URI,
    ASGARDEO_POST_LOGOUT_REDIRECT_URI: process.env.ASGARDEO_POST_LOGOUT_REDIRECT_URI,
    ASGARDEO_SCOPE: process.env.ASGARDEO_SCOPE,
  },
}

export default nextConfig
