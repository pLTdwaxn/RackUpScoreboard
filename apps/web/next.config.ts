import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins:
    process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) =>
      origin.trim(),
    ) ?? [],
};

export default nextConfig;
