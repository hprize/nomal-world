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
    ],
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
