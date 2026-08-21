import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // 백엔드가 CORS 헤더를 내려주지 않아 브라우저에서 직접 fetch가 막힌다.
  // 같은 origin(/api/v1/*, /health)으로 요청하게 하고 서버에서 대신 백엔드로 프록시한다.
  async rewrites() {
    if (!API_BASE_URL) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BASE_URL}/api/v1/:path*`,
      },
      { source: "/health", destination: `${API_BASE_URL}/health` },
    ];
  },
};

export default nextConfig;
