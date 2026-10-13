import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalValue } from "@/components/legal/LegalPage";
import { BRAND_LEGAL, BRAND_NAME, pageTitle } from "@/lib/brand";
import { FEATURES } from "@/lib/features";

export const metadata: Metadata = {
  title: pageTitle("Politique de confidentialité"),
  description: `Quelles données ${BRAND_NAME} traite, pourquoi, avec quels prestataires, combien de temps, et vos droits selon la LPD.`,
};
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" lead="Les données que nous traitons, pourquoi, avec qui, et comment les contrôler.">
      <h2>1. Responsable du traitement</h2>
      <p><LegalValue value={BRAND_LEGAL.operator} />, <LegalValue value={BRAND_LEGAL.address} />. Contact pour la protection des données : <a href={`mailto:${BRAND_LEGAL.privacyEmail}`}>{BRAND_LEGAL.privacyEmail}</a>.</p>
      <p>Cette politique s’applique au site et à l’application {BRAND_NAME}. Elle suit la loi fédérale suisse sur la protection des données (LPD) et, lorsque c’est applicable, le RGPD.</p>

      <h2>2. Données traitées</h2>
      <h3>Compte</h3>
      <ul>
        <li>Adresse e-mail, mot de passe (stocké sous forme hachée par notre prestataire d’authentification, jamais en clair), nom affiché, photo de profil facultative.</li>
        <li>Si vous vous connectez avec Google : l’identifiant, l’adresse e-mail et le nom transmis par Google. Nous ne recevons pas votre mot de passe Google.</li>
        <li>Réponses d’onboarding facultatives : université, année d’études, date d’examen.</li>
      </ul>
      <h3>Entraînement</h3>
      <ul>
        <li>Stations lancées, messages échangés avec le patient simulé, réponses aux grilles, scores, points d’expérience, badges, série de jours actifs.</li>
        <li>Textes dictés : si vous utilisez la dictée, la reconnaissance vocale est réalisée par votre navigateur ; seul le texte reconnu nous parvient.</li>
      </ul>
      <h3>Technique</h3>
      <ul>
        <li>Journaux techniques (horodatage, adresse IP abrégée ou hachée, type de requête) pour la sécurité et la limitation d’usage. L’adresse IP n’est jamais conservée en clair dans nos compteurs de requêtes.</li>
        <li>Messages envoyés via le formulaire de contact et signalements de contenu.</li>
      </ul>
      <p>Nous n’utilisons aucun cookie publicitaire ni outil de suivi tiers. Les seuls cookies sont ceux nécessaires à votre session et à votre préférence de thème.</p>

      <h2>3. Finalités et bases</h2>
      <ul>
        <li><strong>Fournir le service</strong> (exécution du contrat) : authentification, sauvegarde de la progression, correction et débriefing.</li>
        <li><strong>Sécurité et limitation d’usage</strong> (intérêt légitime) : détection d’abus, quotas, protection des comptes.</li>
        <li><strong>Amélioration du contenu</strong> (intérêt légitime) : statistiques agrégées sur les stations, jamais au niveau d’une personne identifiée.</li>
        <li><strong>Communication</strong> : réponse à vos messages ; aucune newsletter sans votre accord explicite.</li>
      </ul>

      <h2>4. Prestataires</h2>
      <p>Nous faisons appel à des sous-traitants qui n’accèdent aux données que pour exécuter leur service :</p>
      <ul>
        <li><strong>Supabase</strong> (base de données, authentification, stockage des photos de profil).</li>
        <li><strong>Fournisseurs de modèles de langage</strong> (Anthropic, et en secours OpenRouter ou Groq) : reçoivent le scénario de la station et vos messages au patient simulé pour générer ses réponses et le débriefing. Aucune donnée de compte (nom, e-mail) ne leur est transmise.</li>
        <li><strong>ElevenLabs</strong> (voix du patient, si activée) : reçoit uniquement le texte de la réplique à prononcer.</li>
        {FEATURES.premium && <li><strong>Stripe</strong> (paiement) : traite vos données de paiement ; nous ne stockons ni numéro de carte ni IBAN.</li>}
        <li><strong>Hébergeur</strong> : <LegalValue value={BRAND_LEGAL.host} />.</li>
      </ul>
      <p>Certains de ces prestataires sont établis hors de Suisse, notamment aux États-Unis. Les transferts reposent sur les clauses contractuelles types et les garanties reconnues par le Préposé fédéral à la protection des données.</p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>Données de compte et de progression : tant que votre compte existe. La suppression du compte efface immédiatement le profil, la progression, les messages et la photo.</li>
        <li>Compteurs de limitation d’usage : fenêtre glissante de 24 heures au plus.</li>
        <li>Messages de contact et signalements : 12 mois au plus après traitement.</li>
        <li>Journaux techniques de l’hébergeur : selon sa politique, en général moins de 30 jours.</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, ainsi que la remise de vos données dans un format courant. Vous pouvez aussi vous opposer à un traitement fondé sur notre intérêt légitime.</p>
      <ul>
        <li>Depuis votre <Link href="/profil">profil</Link> : modifier votre nom et votre photo, changer votre mot de passe, supprimer votre compte.</li>
        <li>Par e-mail : <a href={`mailto:${BRAND_LEGAL.privacyEmail}`}>{BRAND_LEGAL.privacyEmail}</a>. Nous répondons dans les 30 jours.</li>
        <li>Vous pouvez saisir le Préposé fédéral à la protection des données et à la transparence (PFPDT) ou, dans l’Union européenne, votre autorité de contrôle.</li>
      </ul>

      <h2>7. Sécurité</h2>
      <p>Connexions chiffrées (HTTPS), mots de passe hachés, accès à la base de données restreint par des règles de sécurité au niveau des lignes, écritures uniquement par le serveur, limitation du nombre de requêtes et confirmation par e-mail des changements sensibles (adresse, mot de passe). Aucun système n’est infaillible : signalez-nous tout incident à l’adresse ci-dessus.</p>

      <h2>8. Mineurs</h2>
      <p>Le service n’est pas destiné aux personnes de moins de 16 ans. Si vous pensez qu’un compte a été créé par un mineur sans accord parental, écrivez-nous et nous le supprimerons.</p>

      <h2>9. Modifications</h2>
      <p>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de la page ; un changement important vous est signalé dans l’application ou par e-mail.</p>
    </LegalPage>
  );
}
