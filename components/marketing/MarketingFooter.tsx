import { Footer7 } from "@/components/ui/footer-7";
import { FEATURES, type FeatureKey } from "@/lib/features";
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand";

type FooterLink = { name: string; href: string; feature?: FeatureKey };

// Un lien vers un module masqué (lib/features.ts) n'est pas affiché.
const allSections: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Découvrir",
    links: [
      { name: "La méthode", href: "/methode" },
      { name: "Catalogue médical", href: "/catalogue", feature: "fiches" },
      { name: "Tutoriels pratiques", href: "/tutoriels", feature: "tutorials" },
      { name: "Qualité scientifique", href: "/qualite", feature: "fiches" },
      { name: "Tarifs", href: "/pricing" },
      { name: "Questions fréquentes", href: "/faq" },
    ],
  },
  {
    title: "Une station ECOS",
    links: [
      { name: "Anamnèse", href: "/methode#anamnese" },
      { name: "Examen clinique", href: "/methode#examen" },
      { name: "Synthèse", href: "/methode#synthese" },
      { name: "Débriefing", href: "/methode#debriefing" },
    ],
  },
  {
    title: BRAND_NAME,
    links: [
      { name: "À propos", href: "/a-propos" },
      { name: "Nouveautés", href: "/nouveautes" },
      { name: "Nous contacter", href: "/contact" },
      { name: "Se connecter", href: "/login" },
    ],
  },
];
const sections = allSections.map((section) => ({
  ...section,
  links: section.links.filter((link) => !link.feature || FEATURES[link.feature]),
}));

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <Footer7
        copyright={`© 2026 ${BRAND_NAME} · Contenu pédagogique, ne remplace pas un avis médical.`}
        description="La plateforme suisse d’entraînement aux ECOS : un patient simulé, une grille corrigée et un débriefing à chaque station."
        logo={{ url: "/", src: BRAND_LOGO_SRC, alt: BRAND_NAME, title: `Accueil ${BRAND_NAME}`, width: BRAND_LOGO_WIDTH, height: BRAND_LOGO_HEIGHT }}
        sections={sections}
      />
    </footer>
  );
}
