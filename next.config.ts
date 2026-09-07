import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Expose RYMOS_ prefixed env vars to the browser
  env: {
    RYMOS_SUPABASE_URL: process.env.RYMOS_SUPABASE_URL,
    RYMOS_SUPABASE_ANON_KEY: process.env.RYMOS_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
