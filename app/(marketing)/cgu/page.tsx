import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalValue } from "@/components/legal/LegalPage";
import { BRAND_LEGAL, BRAND_NAME, BRAND_PLAN_LABEL, pageTitle } from "@/lib/brand";
import { FEATURES } from "@/lib/features";

export const metadata: Metadata = {
  title: pageTitle("Conditions d’utilisation"),
  description: `Règles d’utilisation du service ${BRAND_NAME} : compte, usage autorisé, contenu, responsabilité et résiliation.`,
};
export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d’utilisation" lead={`Ce que vous pouvez attendre de ${BRAND_NAME}, et ce que nous attendons de vous.`}>
      <h2>1. Objet</h2>
      <p>{BRAND_NAME} est une plateforme d’entraînement aux examens cliniques objectifs structurés (ECOS) : stations avec patient simulé, grilles d’évaluation, débriefings et fiches de méthode. En créant un compte, vous acceptez les présentes conditions et la <Link href="/confidentialite">politique de confidentialité</Link>.</p>
      <p>Le service est fourni par <LegalValue value={BRAND_LEGAL.operator} /> (voir les <Link href="/mentions-legales">mentions légales</Link>).</p>

      <h2>2. Compte</h2>
      <ul>
        <li>Le service s’adresse aux personnes majeures, en priorité aux étudiantes et étudiants en médecine.</li>
        <li>Un compte est personnel. Vous êtes responsable de la confidentialité de votre mot de passe et des actions effectuées depuis votre compte. Prévenez-nous sans délai en cas d’accès non autorisé.</li>
        <li>Vous fournissez une adresse e-mail valide et des informations exactes. Vous pouvez modifier votre nom et votre photo, changer votre mot de passe et supprimer votre compte depuis votre profil.</li>
      </ul>

      <h2>3. Usage autorisé</h2>
      <p>Le service est destiné à votre apprentissage personnel. Il est interdit de :</p>
      <ul>
        <li>extraire, copier ou redistribuer les stations, grilles, fiches ou réponses du patient simulé, par quelque moyen que ce soit ;</li>
        <li>contourner les limites d’usage, les protections techniques ou les contrôles d’accès ;</li>
        <li>utiliser le patient simulé pour produire des contenus illicites, haineux ou visant une personne réelle ;</li>
        <li>perturber le fonctionnement du service (tests de charge, automatisation non autorisée).</li>
      </ul>

      <h2>4. Contenu pédagogique et patient simulé</h2>
      <p>Les contenus sont rédigés à des fins d’entraînement et sont, sauf mention contraire, en attente de validation médicale signée. Ils peuvent comporter des erreurs ou des simplifications. Le patient simulé est généré par un modèle de langage : ses réponses sont fictives et ne reflètent ni un cas réel ni un avis médical. <strong>Rien sur {BRAND_NAME} ne remplace l’enseignement de votre faculté ni l’avis d’un professionnel de santé.</strong></p>

      <h2>5. Limites d’usage</h2>
      <p>Pour maîtriser les coûts liés au patient simulé et à la voix, un nombre maximal de stations, de messages et de répliques vocales par jour est appliqué à chaque compte. Les limites en vigueur sont indiquées dans l’application et peuvent évoluer.</p>

      <h2>6. Offre et prix</h2>
      {FEATURES.premium
        ? <p>Une offre {BRAND_PLAN_LABEL} payante est proposée. Les prix, la durée et les conditions de résiliation sont indiqués au moment de l’achat. Le paiement est traité par Stripe ; nous ne stockons aucune donnée de carte. La résiliation prend effet à la fin de la période en cours.</p>
        : <p>{BRAND_NAME} est actuellement gratuit. Si une offre payante est introduite, ses conditions seront présentées avant tout engagement et les présentes conditions seront mises à jour.</p>}

      <h2>7. Propriété intellectuelle</h2>
      <p>Tous les contenus et le logiciel restent la propriété de leurs auteurs. Vous disposez d’un droit d’usage personnel, non exclusif et non transférable, le temps de l’existence de votre compte. Vos propres saisies (réponses, messages au patient simulé) restent les vôtres ; vous nous autorisez à les traiter pour vous fournir le service (correction, débriefing, statistiques).</p>

      <h2>8. Disponibilité et évolution</h2>
      <p>Le service est fourni « en l’état », en phase de développement. Nous pouvons modifier, suspendre ou retirer des fonctionnalités, y compris des stations, à tout moment. Nous nous efforçons d’assurer une disponibilité raisonnable, sans la garantir.</p>

      <h2>9. Responsabilité</h2>
      <p>Dans les limites permises par le droit suisse, {BRAND_NAME} ne peut être tenu responsable des conséquences d’une décision prise sur la base de ses contenus, d’une indisponibilité du service, ni d’une perte de données de progression. Notre responsabilité pour faute légère est exclue.</p>

      <h2>10. Suspension et résiliation</h2>
      <p>Vous pouvez supprimer votre compte à tout moment depuis votre profil ; vos données sont alors effacées comme décrit dans la politique de confidentialité. Nous pouvons suspendre ou supprimer un compte en cas de violation des présentes conditions, après information par e-mail lorsque c’est possible.</p>

      <h2>11. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit suisse. Le for est au siège du responsable du service, sous réserve des dispositions impératives protégeant les consommateurs.</p>

      <h2>12. Contact</h2>
      <p>Pour toute question : <a href={`mailto:${BRAND_LEGAL.privacyEmail}`}>{BRAND_LEGAL.privacyEmail}</a>.</p>
    </LegalPage>
  );
}
