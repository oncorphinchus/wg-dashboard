/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // This allows us to modify how API routes are handled
  serverRuntimeConfig: {
    // Will only be available on the server side
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_ENV === 'development' ? '0' : undefined,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    API_URL: process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL,
  },
};

module.exports = nextConfig; 