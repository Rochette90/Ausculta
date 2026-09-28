# Stations ECOS et correctifs — 28 septembre 2026

## Déroulé d’une station

- **Entraînement** : sans chronomètre (le serveur ferme simplement une session abandonnée après 3 heures), avec les repères de progression.
- **Examen** : 13 minutes pour toute la station — anamnèse, examen clinique et synthèse. À zéro, la station est corrigée avec ce qui a été fait. Ni indices ni score pendant l’épreuve ; la grille n’est même pas envoyée au navigateur.

1. **Anamnèse** : entretien avec le patient simulé, à l’écrit ou à la voix.
2. **Examen clinique** : l’étudiant l’annonce (bouton « On passe à l’examen clinique » ou une phrase comme « Je vais maintenant vous examiner » ; le patient acquiesce). Trois questions s’affichent : paramètres relevés, examen physique, examens complémentaires. Chaque geste choisi débloque son résultat. Chaque station propose des gestes attendus et des gestes peu utiles ; la liste est triée par ordre alphabétique pour ne rien suggérer. Demander un geste dans le chat renvoie vers cette liste.
3. **Synthèse** : après confirmation (l’entretien et l’examen sont alors fermés), quatre diagnostics sont proposés et l’étudiant rédige sa prise en charge. Puis le bilan.

**Notation (22 points)** : la grille de la station (20 points) et le diagnostic (2 points). La ligne « examen » est calculée d’après les gestes : part des gestes attendus réalisés, moins un demi-point par geste peu utile. Un examen complémentaire attendu commandé pendant l’examen compte aussi dans la prise en charge. Le bilan liste les gestes attendus oubliés et les gestes peu utiles.

## Ce qui change pour l’étudiant

- **Les 12 stations du catalogue `/cas` sont jouables** (au lieu d’une seule). Chaque station a son patient simulé, ses actions rapides, sa grille sur 20 points et son débriefing.
- **Débriefing après la station** : diagnostic, résumé du cas, éléments clés, drapeaux rouges, prise en charge attendue, diagnostics différentiels, liens vers les fiches à réviser et sources. Il n’est envoyé au navigateur qu’après la correction serveur.
- **Examinateur distinct du patient** : les résultats des gestes sont affichés comme ceux de l’examinateur.
- **Adresses neutres** : `/cas/station-01` … `/cas/station-12`. Les anciennes adresses (`/cas/meningite-aigue`) redirigent vers le code neutre, pour que l’URL ne donne pas le diagnostic. Les séances guidées pointent déjà vers les nouveaux codes.
- La consigne s’adapte au lieu (urgences ou cabinet) ; le catalogue affiche la durée du mode examen (13 min).

## Moteur de conversation

- `lib/ecos/stations/*.ts` : une station par fichier (patient, réponses, résultats d’examens, grille, débriefing, sources). `lib/ecos/stations/index.ts` est le registre et attribue les codes publics.
- `lib/ecos/engine.ts` : patient hors ligne. Chaque question d’un message reçoit sa réponse la plus spécifique ; les antécédents sans ambiguïté (allergies, tabac, famille…) sont prioritaires ; un symptôme non scripté est nié comme le ferait un vrai patient ; un examen non prévu reçoit une réponse neutre de l’examinateur.
- Si `GROQ_API_KEY` est défini, le modèle reçoit une consigne construite à partir des mêmes faits (sans le diagnostic) ; en cas d’erreur, le moteur local prend le relais. Vérifier que `GROQ_MODEL` désigne un modèle encore proposé par Groq.
- `lib/ecos/scoring.ts` : grille partagée entre l’affichage en direct (mode entraînement) et la correction serveur. Elle repère des thèmes par mots-clés ; ce n’est pas une évaluation clinique validée.

### Ajouter ou modifier une station

1. Créer `lib/ecos/stations/<slug>.ts` sur le modèle d’une station existante (le slug doit exister dans `content/cases/index.json` et dans la table `clinical_cases`) : patient, réponses, gestes d’examen (`examination`, avec `pertinent` pour les gestes attendus) et diagnostic à choisir (`diagnosisChoice`, une bonne réponse et trois distracteurs).
2. L’ajouter à `ECOS_SCENARIOS` et lui attribuer un nouveau code dans `PUBLIC_CODES` (ne jamais renuméroter un code existant).
3. Publier la ligne `clinical_cases` correspondante (statut `published`).
4. `npm test` vérifie la cohérence : 20 points par grille (+2 pour le diagnostic), gestes attendus et distracteurs dans chaque catégorie, résultats présents, fiches existantes, sources en HTTPS, aucune fuite du diagnostic, des résultats ou de la pertinence des gestes vers le navigateur.

Les contenus médicaux sont des synthèses pédagogiques sourcées. Ils ont été relus par un second passage indépendant (cohérence des constantes, scores et délais, conformité aux recommandations citées), mais **restent en attente d’une validation médicale signée**.

## Correctifs de sécurité

- **Critique** — `admin_upsert_question` : la version à 22 paramètres (images) était exécutable par n’importe quel visiteur, qui pouvait créer ou publier des questions en fournissant l’identifiant d’un administrateur. Elle est désormais réservée au serveur ; l’ancienne version est supprimée.
- **Redirection après connexion** : `?next=/%09/evil.com` contournait la vérification. Toutes les redirections passent par `safeRedirectPath`, qui exige la même origine.
- **Profils** : les colonnes du profil ne sont plus modifiables directement depuis le navigateur (toutes les écritures passent par les routes serveur validées) ; le chemin de l’avatar est vérifié exactement.
- **Diagnostic des stations** : les comptes connectés ne peuvent plus lire `title`, `slug` ni `scenario` de `clinical_cases`, et le diagnostic est retiré du scénario stocké en base.
- **Signature médicale d’une fiche** : elle porte sur la version relue ; si un autre administrateur a enregistré entre-temps, la signature est refusée avec un message explicite.

## Correctifs fonctionnels

- **Facturation Stripe** : pas de second abonnement (abonnement en cours ou session de paiement encore ouverte) ; suppression de compte qui résilie aussi les essais et impayés ; webhook qui relit l’abonnement chez Stripe (événements dans le désordre), calcule le plan sur tous les abonnements et ignore les comptes supprimés au lieu d’échouer en boucle.
- **Série quotidienne** : toute activité qui rapporte de l’XP compte pour la journée ; une série interrompue s’affiche à 0.
- **`/quiz`** ne plante plus si la question du jour a été dépubliée.
- **Profil** : les badges s’affichent (relation mal lue) ; dates au fuseau Europe/Zurich partout où elles étaient affichées sans fuseau.
- **Signalements** : le message « passage plus à jour » s’affiche de nouveau.
- **Suppression de compte et facturation** : les messages d’erreur utiles (résiliation impossible, trop de tentatives) sont affichés.
- **Contact** : un champ refusé ou une limite atteinte n’ouvre plus la messagerie ; le formulaire est vidé après envoi.
- **QCM par spécialité** : toutes les questions non maîtrisées passent avant les questions maîtrisées ; une difficulté inattendue ne peut plus bloquer la génération d’une série.
- **Lectures volumineuses** : les lectures qui pouvaient dépasser la limite de 1 000 lignes de Supabase (progression, banque de questions, liste admin) sont paginées.

## Mise en service

Appliquer, dans l’ordre et via le circuit habituel (`npm run db:push` ou SQL Editor), les migrations non encore appliquées :

1. `supabase/migrations/20260928100000_anatomy_attempts.sql` (intervention précédente, toujours en attente) ;
2. `supabase/migrations/20260928110000_security_and_streak_fixes.sql` ;
3. `supabase/migrations/20260928120000_publish_ecos_stations.sql`.

Déployer le code **en même temps** que la migration 2 : la signature des fiches utilise la nouvelle fonction `admin_review_pathology(…, p_expected_version)` et l’ancienne est supprimée. Tant que la migration 3 n’est pas appliquée, les onze nouvelles stations restent affichées « En préparation » (aucune erreur).

Après application, vérifier :

- avec un compte non administrateur : `/cas` affiche 12 stations disponibles et une station se joue jusqu’au débriefing ;
- qu’un appel REST anonyme à `rpc/admin_upsert_question` est refusé ;
- que la signature d’une fiche fonctionne depuis l’éditeur admin ;
- un paiement test Stripe, puis un second clic sur « Passer à Pro » (refusé).

## Validation

- `npm run typecheck`, `npm run lint` (zéro erreur, trois avertissements préexistants sur des balises images) et `npm test` (88 tests) réussis.
- Le build de production Next.js n’a pas pu être lancé dans l’environnement de travail (binaire SWC indisponible hors du Mac) : lancer `npm run verify` sur le Mac avant de déployer.
- Non testé de bout en bout : parcours connecté réel avec Supabase, webhooks Stripe réels, réponses du modèle Groq, dictée vocale.
