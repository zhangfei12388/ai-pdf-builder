import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: ".vercel/output",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
