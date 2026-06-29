import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@project/shared-ui"],
  experimental: {
    optimizePackageImports: ["@project/shared-ui"],
  },
  async rewrites() {
    return [
      // Proxy value-estimator API (port 8001) — valuation endpoints
      {
        source: '/api/v1/valuation/:path*',
        destination: 'http://localhost:8001/api/v1/valuation/:path*',
      },
      // Proxy market-analysis API (port 8002) — market endpoints
      {
        source: '/api/v1/market/:path*',
        destination: 'http://localhost:8002/api/v1/market/:path*',
      },
    ];
  },
};

export default nextConfig;
