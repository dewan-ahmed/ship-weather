import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vibe's preview proxy sends a non-localhost Host header.
  allowedDevOrigins: ["**.*"],
};

export default nextConfig;
