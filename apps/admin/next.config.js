/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nomal-world/ui", "@nomal-world/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // 로컬 Supabase (supabase start) 이미지
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54331",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    deviceSizes: [640, 960, 1200],
    imageSizes: [384],
    formats: ["image/webp"],
    minimumCacheTTL: 2592000, // 30일
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{
        loader: "@svgr/webpack",
        options: {
          svgoConfig: {
            plugins: [
              {
                name: "preset-default",
                params: {
                  overrides: { removeViewBox: false },
                },
              },
            ],
          },
        },
      }],
    });
    return config;
  },
};

module.exports = nextConfig;
