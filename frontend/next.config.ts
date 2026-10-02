import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
  },
  async rewrites() {
    return process.env.API_BASE_URL
      ? [{ source: "/uploads/:path*", destination: `${process.env.API_BASE_URL.replace(/\/$/, "")}/uploads/:path*` }]
      : [];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3-eu-west-1.amazonaws.com",
        pathname: "/course.oc-static.com/**",
      },
    ],
  },
};

export default nextConfig;
