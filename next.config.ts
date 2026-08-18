import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/photo-1548013146-72479768bada",
        search: "",
      },
    ],
  },
};

export default nextConfig;
