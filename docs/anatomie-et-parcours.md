# Anatomie et parcours de révision — 28 septembre 2026

## Fonctionnalités

- `/anatomie` : carte schématique accessible au clavier, recherche sans accents, filtres par région et résultats récents.
- `/anatomie/[slug]` : six modules, 18 repères, 18 questions de rappel et 12 questions réparties dans six mini-cas. Parcours Comprendre → Se tester → Appliquer, noms masquables, corrections expliquées et sources consultables.
- `/specialties` : recherche dans les titres, résumés et spécialités ; filtre par spécialité et par fiches restant à lire ; liens réciproques fiches–anatomie.
- `/cas` : catalogue filtrable séparant ECOS oraux et mini-cas de localisation anatomique.
- Navigation, page d’accueil publique et tableau de bord : accès direct à l’anatomie. États de chargement, d’erreur et de contenu introuvable communs à l’espace connecté. Navigation mobile, focus clavier et mouvements réduits.

## ECOS

Le mode examen masque les indices et le score pendant l’entretien. Le chronomètre commence après la création de la session, utilise une échéance réelle et déclenche la sauvegarde à expiration. Un échange en cours est attendu avant la clôture. Le rapport affiche les critères recalculés par le serveur et propose de réessayer si la sauvegarde échoue. La reconnaissance et la synthèse vocales sont arrêtées à la sortie.

Mise à jour : les 12 stations disposent désormais d’un moteur de conversation, d’une grille et d’un débriefing (voir [Stations ECOS et correctifs](ecos-stations-et-correctifs.md)). L’API vérifie le scénario demandé et sa publication, et refuse les nouveaux messages après 13 minutes en mode examen (l’entraînement est sans chronomètre). Le repérage de compétences reste fondé sur des mots-clés : ce n’est pas une évaluation clinique validée.

## Backend

- `POST /api/anatomy/[slug]` : utilisateur authentifié, contrôle d’origine, limitation de débit, validation du mode et des réponses, correction serveur.
- Chaque tentative possède un UUID. Une nouvelle tentative est immuable ; une répétition réseau du même envoi ne crée pas un second résultat. Le navigateur ne choisit ni le score ni l’identité utilisateur.
- Les réponses correctes et les explications ne sont pas incluses dans les propriétés des questionnaires envoyées au navigateur avant correction.
- `/api/progress` accepte uniquement les deux tutoriels connus, dont le score est recalculé à partir des réponses. Les fiches et QCM gardent leurs actions serveur dédiées. Un score fourni directement par le navigateur n’est plus accepté.
- Les corps JSON sont limités pendant leur lecture, y compris sans `Content-Length`.

## Activation Supabase

Appliquer uniquement la nouvelle migration `supabase/migrations/20260928100000_anatomy_attempts.sql` via le circuit de migration habituel ou le SQL Editor du projet concerné. Elle crée une table et son index, active RLS, permet à chaque utilisateur de lire uniquement ses propres tentatives et réserve les écritures au serveur.

La migration n’a pas été exécutée sur la base distante. La présence des colonnes a été vérifiée en lecture seule : Supabase retourne `PGRST205` (table absente). Aucun accès SQL de migration n’est configuré dans l’environnement local. Avant application, les résultats corrigés sont affichés avec un état explicitement non sauvegardé. Après application, vérifier avec deux comptes que l’historique de l’un n’est pas lisible par l’autre et qu’un renvoi du même UUID produit une seule ligne.

La suppression d’un compte supprime les tentatives par cascade. Les résultats d’anatomie sont un historique pédagogique propre au module, sans attribution de XP et sans modification de la maîtrise des spécialités.

## Validation et limites

Les tests couvrent la cohérence des liens vers les fiches, les clés de réponse, les scores complets/partiels/nuls, les données falsifiées, les propriétés publiques des questionnaires, la validation des tutoriels, les flux HTTP bornés et le rattrapage du chronomètre après suspension d’un onglet.

Les écrans ont été vérifiés avec les composants réels et des données locales de contrôle, à 390 px et à 1366 px : recherche, état vide, réinitialisation, masquage des noms, onglets, réponses conservées après erreur, mode examen sélectionnable, reprise après échec de démarrage, thème sombre. La page temporaire de contrôle a été supprimée avant livraison. Le cycle complet connecté avec écritures Supabase, les permissions RLS en situation réelle et la dictée vocale n’ont pas été testés de bout en bout.

Le contenu d’anatomie est une synthèse pédagogique nouvelle et sourcée ; il reste en attente d’une validation médicale signée. La carte est un outil de navigation schématique, pas une planche anatomique à l’échelle. Les 156 fiches existantes et leur statut éditorial ont été conservés.

Sources consultées : chapitres pertinents d’[OpenStax Anatomy & Physiology](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction), [voie corticospinale](https://www.ncbi.nlm.nih.gov/sites/books/NBK535423/), [nerf radial](https://www.ncbi.nlm.nih.gov/books/NBK534840/), [nerf médian](https://www.ncbi.nlm.nih.gov/books/NBK448084/) et [nerf fibulaire commun](https://www.ncbi.nlm.nih.gov/books/NBK532968/). Les liens précis figurent également dans chaque module.
