import type { NextConfig } from "next";

// Static export for GitHub Pages. basePath is the repo subpath in CI
// (NEXT_PUBLIC_BASE_PATH), empty in local dev so localhost:3000 works normally.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
};

export default nextConfig;
