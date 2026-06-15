import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['[IP_ADDRESS]'],

  // Disable the Next.js built-in floating DevTools indicator (the "N" circle
  // that shows Route / Bundler / Preferences). This toolbar is injected by
  // the framework itself — it is not part of any app component.
  // Setting this to false removes it in both development and production.
  devIndicators: false,
};

export default nextConfig;
