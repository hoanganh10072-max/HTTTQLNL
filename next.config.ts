import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
