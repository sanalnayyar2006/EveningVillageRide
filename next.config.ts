import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  // A stray lockfile in a parent folder confuses workspace-root detection.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
