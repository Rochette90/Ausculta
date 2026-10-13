import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalValue } from "@/components/legal/LegalPage";
import { BRAND_DOMAIN, BRAND_LEGAL, BRAND_NAME, pageTitle } from "@/lib/brand";
import { LICENSE_URLS } from "@/lib/ecos/image-credits";
import { THIRD_PARTY_IMAGES } from "@/lib/legal/third-party-images";

export const metadata: Metadata = {
  title: pageTitle("Mentions légales"),
  description: `Identité du responsable du service ${BRAND_NAME}, hébergement et propriété intellectuelle.`,
};
export const dynamic = "force-dynamic";

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" lead={`Qui est responsable de ${BRAND_NAME}, où le service est hébergé et comment nous joindre.`}>
      <h2>Responsable du service</h2>
      <p>
        Le site <strong>{BRAND_DOMAIN}</strong> et l’application {BRAND_NAME} sont édités par <LegalValue value={BRAND_LEGAL.operator} />,
        {" "}<LegalValue value={BRAND_LEGAL.address} />.
      </p>
      <p>Contact : <a href={`mailto:${BRAND_LEGAL.privacyEmail}`}>{BRAND_LEGAL.privacyEmail}</a> ou via le <Link href="/contact">formulaire de contact</Link>.</p>

      <h2>Hébergement</h2>
      <p>Application hébergée par <LegalValue value={BRAND_LEGAL.host} />. Base de données et authentification : Supabase, Inc. Paiements, si une offre payante est activée : Stripe, Inc.</p>

      <h2>Propriété intellectuelle</h2>
      <p>Les stations, grilles, fiches, textes, illustrations et le code de {BRAND_NAME} sont protégés par le droit d’auteur. Toute reproduction, diffusion ou réutilisation en dehors d’un usage personnel d’apprentissage nécessite une autorisation écrite préalable.</p>

      <h2>Images médicales de tiers</h2>
      <p>Certaines images d’examen proviennent de Wikimedia Commons et restent régies par leur licence d’origine (réutilisation libre avec attribution). Elles sont reprises sans modification, sauf une photographie réduite et convertie en JPEG. Les ECG sont des tracés synthétiques créés pour {BRAND_NAME}.</p>
      <ul>
        {THIRD_PARTY_IMAGES.map((image) => (
          <li key={image.title}><a href={image.source} target="_blank" rel="noopener noreferrer">{image.title}</a>, {image.author}, <a href={LICENSE_URLS[image.license]} target="_blank" rel="noopener noreferrer">{image.license}</a></li>
        ))}
      </ul>

      <h2>Avertissement</h2>
      <p>{BRAND_NAME} est un outil d’entraînement destiné aux étudiantes et étudiants en médecine. Son contenu est pédagogique, en attente de validation médicale signée, et ne constitue en aucun cas un avis, un diagnostic ou un traitement médical.</p>

      <h2>Textes liés</h2>
      <ul>
        <li><Link href="/cgu">Conditions d’utilisation</Link></li>
        <li><Link href="/confidentialite">Politique de confidentialité</Link></li>
      </ul>
    </LegalPage>
  );
}
