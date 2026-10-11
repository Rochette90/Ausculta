import type { Metadata } from "next";
import { ThemeInitializer } from "../components/theme/ThemeInitializer";
import "./globals.css";
import "./learning.css";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

function metadataOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataOrigin(),
  title: `${BRAND_NAME} — Maîtrisez vos ECOS`,
  description: "Plateforme suisse d’entraînement aux ECOS avec patients simulés interactifs.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: `${BRAND_NAME} — Maîtrisez vos ECOS`,
    description: "Entraînez votre raisonnement clinique avec des patients simulés interactifs.",
    images: [{ url: "/og-home.png", width: 1536, height: 1024, alt: `${BRAND_NAME} — ${BRAND_TAGLINE}` }],
    locale: "fr_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Maîtrisez vos ECOS`,
    description: "Entraînez votre raisonnement clinique avec des patients simulés interactifs.",
    images: ["/og-home.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" data-theme="light" lang="fr" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
