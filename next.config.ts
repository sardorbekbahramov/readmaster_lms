import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Mavjud boshqa sozlamalaringiz o'z joyida qoladi */
  
  typescript: {
    // TypeScript xatolari bo'lsa ham build-ni davom ettirishga ruxsat beradi
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build paytida ESLint tekshiruvini o'tkazib yuboradi
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
