import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FEATURES, type FeatureKey } from "@/lib/features";
import { BRAND_NAME } from "@/lib/brand";

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
    <footer className="site-footer">
      <div className="mk-wrap">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link className="logo" href="/" aria-label={`Accueil ${BRAND_NAME}`}><BrandLogo /></Link>
            <p>La plateforme suisse d’entraînement aux ECOS : un patient simulé, une grille corrigée et un débriefing à chaque station.</p>
          </div>
          {sections.map((section) => (
            <nav aria-label={section.title} key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.links.map((link) => <li key={link.href}><Link href={link.href}>{link.name}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="site-footer-bottom">
          <span>© 2026 {BRAND_NAME}. Contenu pédagogique, ne remplace pas un avis médical.</span>
          <a href="#top">Revenir en haut de la page</a>
        </div>
      </div>
    </footer>
  );
}
