import type { NextConfig } from "next";
const config: NextConfig = {
  trailingSlash: true,
  outputFileTracingIncludes: {
    "/api/books/\\[slug\\]/download": ["./src/lib/pdf-fonts/*.ttf"],
  },
  images: { unoptimized: true },
};
export default config;
