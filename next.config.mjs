/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint will run during builds to catch errors
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.asos-media.com" },
      { protocol: "https", hostname: "static.asosservices.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "flannels.com" },
      { protocol: "https", hostname: "www.flannels.com" },
      { protocol: "https", hostname: "static.nike.com" },
      { protocol: "https", hostname: "example.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};
export default nextConfig;
