# Ausculta

Plateforme Next.js d’entraînement médical avec authentification Supabase, progression PostgreSQL sécurisée par RLS, stations ECOS et abonnements Stripe.

## Architecture

- Next.js 16, App Router, TypeScript et Tailwind CSS
- socle shadcn/ui (`components.json`, `cn()` et Lucide)
- Supabase Auth, PostgreSQL, Storage, Realtime et RLS
- Stripe Checkout, Customer Portal et webhooks
- Modèle de langage optionnel pour le patient simulé (Anthropic, OpenRouter ou Groq), avec moteur local de secours
- déploiement Vercel, région Frankfurt

```text
app/
├── (marketing)/        # / et /pricing
├── (auth)/             # /login et /signup
├── (app)/              # /dashboard, /fiches, /quiz, /cas, /profil
├── api/                # API sécurisées et webhooks
└── auth/               # callback OAuth et déconnexion
components/             # UI marketing, authentification et profil
supabase/migrations/    # schéma, RLS, fonctions et données métier
```

Le catalogue Supabase comprend `profiles`, `specialties`, `pathologies`, `questions`, `question_options`, `clinical_cases`, `user_progress`, `quiz_attempts`, `badges`, `user_badges` et `subscriptions`.

## Démarrage local

1. Copier `.env.example` vers `.env.local` et renseigner les valeurs.
2. Créer ou lier un projet Supabase dans une région européenne proche (Frankfurt recommandé).
3. Appliquer les migrations Supabase avec `npm run db:push` ou depuis le SQL Editor Supabase.
4. Importer le catalogue local (156 fiches, 12 questions et 12 cas) avec `npm run db:seed`.
5. Ajouter `http://localhost:3000/auth/callback` aux Redirect URLs de Supabase Auth.
6. Lancer `npm run dev`.

La clé `SUPABASE_SERVICE_ROLE_KEY`, les secrets Stripe, les clés Anthropic, OpenRouter et Groq et la clé ElevenLabs restent exclusivement côté serveur. Ils ne doivent jamais porter le préfixe `NEXT_PUBLIC_`.

## Stripe

Créer un produit/prix récurrent puis renseigner `STRIPE_PRO_PRICE_ID`. Le webhook Stripe doit cibler :

`https://votre-domaine/api/billing/webhook`

Événements nécessaires :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copier ensuite le secret de signature dans `STRIPE_WEBHOOK_SECRET`.

## Déploiement Vercel

Importer le projet, ajouter toutes les variables de `.env.example`, puis déployer. Dans Supabase, ajouter l’URL Vercel finale à `Site URL` et `Redirect URLs` avec le chemin `/auth/callback`.

## Vérification

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run verify` pour tout exécuter dans l’ordre

## Anatomie clinique et parcours de révision

Le module `/anatomie` propose six parcours avec repères, rappel actif, mini-cas et liens vers les fiches. Le catalogue `/specialties` offre une recherche et un filtre de lecture ; `/cas` distingue ECOS et raisonnement anatomique.

Pour activer l’historique d’anatomie, appliquer `supabase/migrations/20260928100000_anatomy_attempts.sql`. Les corrections restent disponibles avec un message de non-sauvegarde tant que cette table manque. Voir [la documentation fonctionnelle et technique](docs/anatomie-et-parcours.md) pour les protections backend et les limites de validation.

## Stations ECOS

Les 12 stations de `/cas` se déroulent en trois temps — anamnèse avec un patient simulé (moteur local, modèle de langage optionnel), examen clinique où chaque geste choisi débloque son résultat, puis synthèse (diagnostic parmi quatre propositions et prise en charge) — et sont notées sur 22 points avec un débriefing sourcé révélé après la correction serveur. L’entraînement est sans chronomètre ; le mode examen dure 13 minutes pour toute la station. Les adresses utilisent un code neutre (`/cas/station-04`) pour ne pas donner le diagnostic. Pour les activer et appliquer les correctifs de sécurité, appliquer `20260928110000_security_and_streak_fixes.sql` puis `20260928120000_publish_ecos_stations.sql`, en déployant le code en même temps. Détails, ajout d’une station et vérifications : [Stations ECOS et correctifs](docs/ecos-stations-et-correctifs.md).

### Patient joué par un modèle

Sans clé, le patient répond à partir des mots-clés du script (`lib/ecos/engine.ts`). Avec une clé, un modèle joue le patient à partir des mêmes faits, sans le diagnostic. Comme un patient standardisé, il ne répond qu’à la question posée, en une ou deux phrases, et ne donne rien de lui-même : à une question ouverte, il ne livre qu’un élément, et l’étudiant doit aller chercher chaque détail (consigne dans `buildPatientPrompt`). Les fournisseurs configurés sont essayés dans l’ordre : `ANTHROPIC_API_KEY` (modèle `claude-haiku-5-5` par défaut, réglable par `ANTHROPIC_MODEL`), puis `OPENROUTER_API_KEY` en secours (`anthropic/claude-haiku-5.5` par défaut, réglable par `OPENROUTER_MODEL`), puis `GROQ_API_KEY`. `PATIENT_AI_PROVIDER` place un fournisseur en tête. Si tous échouent, le moteur local répond ; le motif de chaque échec est journalisé côté serveur (`Ausculta patient: …`). Voir `lib/ecos/patient-ai.ts`.

Le patient ne comprend pas le jargon : face à « dyspnée », « irradiation » ou « HTA » employés sans explication, il demande ce que le mot veut dire (liste dans `lib/ecos/jargon.ts`). Il réagit aussi à l’attitude de l’étudiant : il se détend quand on le rassure, et se ferme quand on ignore ce qu’il dit. Chaque script donne, en plus des antécédents, la vie quotidienne, le ressenti, les épisodes antérieurs, l’évolution et la réponse à « Avez-vous d’autres symptômes ? » (un seul élément) ; une réponse du script ne porte qu’une information.

### Correction et bilan

La grille est d’abord corrigée par mots-clés (`lib/ecos/scoring.ts`). À la fin de la station, s’il y a une clé de modèle, le modèle relit l’entretien pour les seuls éléments manqués et valide ceux que l’étudiant a abordés avec d’autres mots (`lib/ecos/review.ts`). Chaque élément validé doit citer mot pour mot au moins trois mots d’une seule ligne de l’étudiant, sinon il est refusé ; une même citation ne vaut que pour deux éléments, une relecture n’ajoute pas plus de six éléments, et ce que les mots-clés avaient trouvé reste acquis. La relecture est enregistrée avec le transcript (ligne système `Relecture de la grille : …`) et revérifiée à chaque réouverture du bilan ; sans réponse en 12 secondes, la note des mots-clés vaut seule (`Ausculta review: …` dans le journal du serveur).

Le bilan affiche aussi la communication (`lib/ecos/communication.ts`), sans effet sur la note : questions ouvertes, ciblées et fermées, questions posées à la chaîne, jargon employé, empathie, exploration des inquiétudes, résumé et vérification de la compréhension, avec quelques conseils pour la station suivante.

### Voix du patient

Le bouton « Voix » de la station lit les répliques du patient. Avec `ELEVENLABS_API_KEY` et au moins `ELEVENLABS_VOICE_FEMALE` et `ELEVENLABS_VOICE_MALE` (identifiants de voix choisis dans le compte ElevenLabs), la lecture passe par `/api/ecos/speech`, qui ne synthétise que des répliques déjà enregistrées dans la session de l’utilisateur. `ELEVENLABS_VOICE_FEMALE_YOUNG` et `ELEVENLABS_VOICE_MALE_YOUNG` (facultatifs) servent aux patients de moins de 35 ans ; `ELEVENLABS_MODEL` vaut `eleven_flash_v2_5` par défaut. Sans cette configuration, ou si le service échoue, la synthèse vocale du navigateur prend le relais. Le texte des répliques du patient est alors envoyé à ElevenLabs ; la voix de l’étudiant ne l’est pas.

La réponse du patient arrive en flux (`/api/ecos/chat` renvoie une ligne JSON par événement, voir `lib/ecos/chat-stream.ts`) : le modèle écrit mot à mot, la première phrase est synthétisée dès qu’elle est complète et le navigateur la joue pendant que la suite s’écrit. Seule la phrase d’ouverture passe encore par `/api/ecos/speech`. En développement, le journal du serveur et la console du navigateur affichent la durée de chaque étape (`Ausculta timing …`).
