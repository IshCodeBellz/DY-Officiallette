/** @type {import('next').NextConfig} */
const nextConfig = {
  // Relax build blockers so we can produce artifacts while fixing lint/type issues
  eslint: {
    // Skip ESLint errors during production builds
    // ignoreDuringBuilds: true,
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Skip TypeScript type errors during production builds
    // ignoreBuildErrors: true,
    ignoreBuildErrors: false,
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
      { protocol: "https", hostname: "media.about.nike.com" },
    ],
  },
};
export default nextConfig;
