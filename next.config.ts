import type { NextConfig } from "next";

// Pfade des alten Aufbaus (bis 2026-10) – alte Lesezeichen landen im neuen Einstieg.
const LEGACY_PATHS = ["/dashboard", "/dashboard/:path*", "/settings", "/settings/:path*", "/onboarding", "/onboarding/:path*"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...LEGACY_PATHS.map(source => ({ source, destination: "/weiter", permanent: false })),
      // Wettbewerber wurden durch Impulse ersetzt (2026-10-30).
      { source: "/p/:id/wettbewerber", destination: "/p/:id/impulse", permanent: false },
    ];
  },
};

export default nextConfig;
