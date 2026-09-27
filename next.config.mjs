/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for mobile-first
  reactStrictMode: true,
  // Allow Supabase image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
