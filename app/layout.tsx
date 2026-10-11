import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { ThemeInitializer } from "../components/theme/ThemeInitializer";
import "./globals.css";
import "./learning.css";
import "./styles/marketing.css";
import "./styles/station.css";
import "./styles/fiche.css";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

// Deux voix typographiques : le sans-serif pour l'interface et l'étudiant,
// le serif pour la parole du patient et les phrases de récit. Polices
// auto-hébergées au build (aucune requête vers Google depuis le navigateur).
const sans = Hanken_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-hanken", display: "swap" });
const voice = Newsreader({ subsets: ["latin", "latin-ext"], variable: "--font-newsreader", display: "swap", axes: ["opsz"] });

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1a20" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${sans.variable} ${voice.variable}`} data-scroll-behavior="smooth" data-theme="light" lang="fr" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
