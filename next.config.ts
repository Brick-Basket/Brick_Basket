import type { NextConfig } from "next";

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase 22):
// `hostname: "**"` allowed images from *any* HTTPS host — a wide-open
// remote-image allowlist with no documented reason, flagged in the
// stabilization audit. Narrowed to the hosts this app actually needs today
// (none yet — every current image is a local `/public` asset or a CSS/DOM
// placeholder box, see docs/OPEN_QUESTIONS.md #43). Add a real entry here
// the moment a CDN/asset host is confirmed (e.g. the eventual approved
// project-photo storage bucket) rather than reopening the wildcard.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
