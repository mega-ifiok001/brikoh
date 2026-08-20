/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: generates plain HTML/CSS/JS (no Node server required).
  output: "export",
  // Emit the static site into `dist/` (same folder this preview serves).
  distDir: "dist",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
