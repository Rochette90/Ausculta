import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME, pageTitle } from "@/lib/brand";
import { FEATURES, type FeatureKey } from "@/lib/features";

export const metadata: Metadata = {
  title: pageTitle("Nouveautés"),
  description: `Suivez les dernières évolutions des stations ECOS et de l’expérience d’entraînement ${BRAND_NAME}.`,
};
export const dynamic = "force-dynamic";

type Release = { date: string; iso: string; tag: string; title: string; text: string; href: string; link: string; feature?: FeatureKey };

// Une entrée qui concerne un module masqué (lib/features.ts) n'est pas affichée.
const allReleases: Release[] = [
  { date: "11 octobre 2026", iso: "2026-10-11", tag: "Interface", title: "Une interface repensée autour de l’entretien", text: "La parole du patient passe au premier plan : une nouvelle typographie, l’échange présenté comme une transcription et une conversation vocale plus lisible, sur ordinateur comme sur téléphone.", href: "/methode", link: "Voir le déroulé d’une station" },
  { date: "11 octobre 2026", iso: "2026-10-11", tag: "Marque", title: `${BRAND_NAME} se concentre sur les stations ECOS`, text: "Nouveau nom, nouveau logo et un cap plus net : la plateforme se concentre d’abord sur les stations ECOS avec patient simulé. Les fiches de révision et les QCM reviendront ensuite.", href: "/methode", link: "Voir le déroulé d’une station" },
  { date: "28 septembre 2026", iso: "2026-09-28", tag: "Stations ECOS", title: "Douze stations jouables, en trois temps", text: "Chaque station enchaîne anamnèse, examen clinique et synthèse, en mode entraînement ou examen. La correction donne une grille sur 22 points et un débriefing avec les gestes oubliés, les drapeaux rouges et les sources.", href: "/methode", link: "Découvrir la méthode" },
  { date: "21 août 2026", iso: "2026-08-21", tag: "Cursus B3", title: "Le catalogue suit désormais les cinq modules du Bachelor 3", text: "Vingt-six fiches issues du vault renforcent l'abdomen, l'immunologie-inflammation et la pédiatrie. Le catalogue atteint 156 fiches, toutes intégrées au parcours de révision et soumises au workflow de validation.", href: "/catalogue", link: "Explorer les modules B3", feature: "fiches" },
  { date: "12 août 2026", iso: "2026-08-12", tag: "Tutoriels", title: "Deux nouvelles méthodes interactives : ECG et radio thorax", text: "Chaque tutoriel propose une progression pas à pas, une check-list active et trois questions d'auto-évaluation, à partir des notes du vault MED - Last Dance.", href: "/tutoriels", link: "Ouvrir les tutoriels", feature: "tutorials" },
  { date: "12 août 2026", iso: "2026-08-12", tag: "Catalogue", title: "130 fiches dans quinze spécialités alimentées", text: "Quarante notes du vault rejoignent le catalogue en urgences, radiologie, néphrologie, hématologie, oncologie, pédiatrie, psychiatrie, rhumatologie et dermatologie. Elles sont toutes marquées à réviser.", href: "/catalogue", link: "Explorer le catalogue", feature: "fiches" },
  { date: "12 août 2026", iso: "2026-08-12", tag: "Qualité éditoriale", title: "Les fiches affichent désormais leur état de révision", text: "Toutes les fiches passent par un statut explicite. Une validation est datée et signée ; une modification ultérieure la replace automatiquement à réviser.", href: "/qualite", link: "Comprendre la validation", feature: "fiches" },
  { date: "11 août 2026", iso: "2026-08-11", tag: "Entraînement", title: "Quiz par spécialité et suivi des erreurs", text: "Les sessions de questions peuvent cibler une spécialité, enregistrer les réponses et faire revenir les notions fragiles dans la progression.", href: "/methode#qcm", link: "Voir la méthode QCM", feature: "quiz" },
  { date: "10 août 2026", iso: "2026-08-10", tag: "Progression", title: "Un tableau de bord pour guider la prochaine activité", text: "XP, niveau, série quotidienne et activités terminées sont réunis pour rendre la régularité visible sans alourdir les révisions.", href: "/methode", link: "Découvrir la méthode" },
];
const releases = allReleases.filter((release) => !release.feature || FEATURES[release.feature]);

export default async function NewsPage() {
  return (
    <main>
      <header className="mk-head mk-wrap">
        <h1>Nouveautés</h1>
        <p className="lead">Nouveau contenu, changements de méthode et améliorations du produit : ce qui a réellement changé, du plus récent au plus ancien.</p>
      </header>

      <section className="mk-section is-surface" aria-label="Journal du produit">
        <div className="mk-wrap">
          <ol className="releases">
            {releases.map((release) => (
              <li className="script-line" key={`${release.iso}-${release.title}`}>
                <div className="release-meta"><time dateTime={release.iso}>{release.date}</time><span>{release.tag}</span></div>
                <div>
                  <h2>{release.title}</h2>
                  <p>{release.text}</p>
                  <Link className="text-link" href={release.href}>{release.link}</Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mk-end" aria-labelledby="news-end-title">
        <div className="mk-wrap">
          <h2 id="news-end-title">Une amélioration utile commence souvent par un retour précis.</h2>
          <p>Dites-nous la spécialité, le format ou la fonctionnalité qui vous manque le plus.</p>
          <Link className="button primary" href="/contact">Proposer une amélioration</Link>
        </div>
      </section>
    </main>
  );
}
