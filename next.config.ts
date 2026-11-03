import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "100mb" }, // myndir og skjöl
  },
};

export default nextConfig;
