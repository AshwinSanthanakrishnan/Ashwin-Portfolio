import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone on the local network to connect without being blocked
  allowedDevOrigins: ['192.168.68.83'] as any,
};

export default nextConfig;
