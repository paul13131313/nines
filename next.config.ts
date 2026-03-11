import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "media.rawg.io" },
    ],
  },
};

export default nextConfig;
