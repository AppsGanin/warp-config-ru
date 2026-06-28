/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The /api/generate route reads config/templates/*.yaml at runtime via fs.
  // Force-include them in the function bundle so they ship on Netlify/Vercel.
  outputFileTracingIncludes: {
    "/api/generate": ["./config/templates/*.yaml"],
  },
};

export default nextConfig;
