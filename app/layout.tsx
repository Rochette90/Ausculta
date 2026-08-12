import type { Metadata } from "next";
import "./globals.css";

const themeBootstrapScript = `
  try {
    const storedTheme = localStorage.getItem("medtrain-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
`;

function metadataOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataOrigin(),
  title: "MedTrain — Maîtrisez vos ECOS",
  description: "Plateforme suisse d’entraînement aux ECOS avec patients simulés interactifs.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "MedTrain — Maîtrisez vos ECOS",
    description: "Entraînez votre raisonnement clinique avec des patients simulés interactifs.",
    images: [{ url: "/og-home.png", width: 1536, height: 1024, alt: "MedTrain — Apprenez la médecine en la pratiquant" }],
    locale: "fr_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedTrain — Maîtrisez vos ECOS",
    description: "Entraînez votre raisonnement clinique avec des patients simulés interactifs.",
    images: ["/og-home.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" data-theme="light" lang="fr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
