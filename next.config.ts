import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./lib/security/csp";

const isDevelopment = process.env.NODE_ENV === "development";
// Version sans nonce (`script-src 'self' 'unsafe-inline'`, `frame-ancestors 'none'`,
// voir lib/security/csp.ts) : filet de sécurité pour les réponses qui ne passent
// pas par `proxy.ts`, qui pose, lui, une CSP avec nonce par requête.
const contentSecurityPolicy = buildContentSecurityPolicy({ isDevelopment });

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDevelopment ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

// `output: "standalone"` uniquement pour l'image Docker (voir Dockerfile) :
// `next start` refuse ce mode, et l'hébergement Node.js géré d'Infomaniak
// lance `npm start` avec les node_modules complets.
const standalone = process.env.NEXT_STANDALONE === "1";

const nextConfig: NextConfig = {
  ...(standalone ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  // Nécessaire pour `forbidden()` : les pages /admin doivent répondre 403 à un
  // compte authentifié sans le rôle admin, pas rediriger silencieusement.
  experimental: { authInterrupts: true },
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/pathologies/[slug]": ["./content/pathologies/*.md"],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: securityHeaders,
    }];
  },
};

export default nextConfig;
