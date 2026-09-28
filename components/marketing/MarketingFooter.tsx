import { Footer7 } from "@/components/ui/footer-7";
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand";

const sections = [
  {
    title: "Découvrir",
    links: [
      { name: "Catalogue médical", href: "/catalogue" },
      { name: "Tutoriels pratiques", href: "/tutoriels" },
      { name: "La méthode", href: "/methode" },
      { name: "Qualité scientifique", href: "/qualite" },
      { name: "Tarifs", href: "/pricing" },
    ],
  },
  {
    title: "La plateforme",
    links: [
      { name: "Fiches médicales", href: "/methode#fiches" },
      { name: "QCM expliqués", href: "/methode#qcm" },
      { name: "Cas cliniques", href: "/methode#cas-cliniques" },
      { name: "Suivi de progression", href: "/methode#progression" },
    ],
  },
  {
    title: BRAND_NAME,
    links: [
      { name: "À propos", href: "/a-propos" },
      { name: "Nouveautés", href: "/nouveautes" },
      { name: "Questions fréquentes", href: "/faq" },
      { name: "Nous contacter", href: "/contact" },
      { name: "Se connecter", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <Footer7
        copyright={`© 2026 ${BRAND_NAME} · Contenu pédagogique, ne remplace pas un avis médical.`}
        description="La plateforme suisse de révision médicale qui relie connaissances, décisions cliniques et progression quotidienne."
        logo={{ url: "/", src: BRAND_LOGO_SRC, alt: BRAND_NAME, title: `Accueil ${BRAND_NAME}`, width: BRAND_LOGO_WIDTH, height: BRAND_LOGO_HEIGHT }}
        sections={sections}
      />
    </footer>
  );
}
