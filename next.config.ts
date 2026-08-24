import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        // next/image는 여기 없는 외부 호스트는 런타임 에러로 막는다.
        // REQ-DETAIL-001 검색 결과의 image_url이 Google Places 사진(이 도메인)인 경우가 있어 등록.
        protocol: "https",
        hostname: "places.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        // REQ-EXT-002(TourAPI) 이미지 CDN. 실제 응답이 http로 내려온다(https 아님).
        protocol: "http",
        hostname: "tong.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
