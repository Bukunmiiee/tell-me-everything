import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15's dev server only trusts "localhost" for internal asset/HMR
  // requests by default. If you (or your browser's autocomplete) load the
  // app via 127.0.0.1 instead, client-side navigations silently fail to
  // load the next page's JS. This explicitly allows that origin too.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
