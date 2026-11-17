import type { NextConfig } from "next";
const config: NextConfig = {
  trailingSlash: true,
  webpack(config, { isServer }) {
    if (isServer) {
      // Embed the PDF fonts so the deployed function can load them without filesystem paths.
      config.module.rules.push({
        test: /\.ttf$/i,
        include: /[/\\]src[/\\]lib[/\\]pdf-fonts[/\\]/,
        type: "asset",
        parser: { dataUrlCondition: { maxSize: Infinity } },
      });
    }
    return config;
  },
  images: { unoptimized: true },
};
export default config;
