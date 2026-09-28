# MedTrain

Plateforme Next.js d’entraînement médical avec authentification Supabase, progression PostgreSQL sécurisée par RLS, stations ECOS et abonnements Stripe.

## Architecture

- Next.js 16, App Router, TypeScript et Tailwind CSS
- socle shadcn/ui (`components.json`, `cn()` et Lucide)
- Supabase Auth, PostgreSQL, Storage, Realtime et RLS
- Stripe Checkout, Customer Portal et webhooks
- Groq optionnel pour le patient simulé, avec moteur local de secours
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

La clé `SUPABASE_SERVICE_ROLE_KEY`, les secrets Stripe et la clé Groq restent exclusivement côté serveur. Ils ne doivent jamais porter le préfixe `NEXT_PUBLIC_`.

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

Pour activer l’historique d’anatomie, appliquer `supabase/migrations/20260928100000_anatomy_attempts.sql`. Les corrections restent disponibles avec un message de non-sauvegarde tant que cette table manque. Voir [la documentation fonctionnelle et technique](docs/anatomie-et-parcours.md) pour les changements ECOS, les protections backend et les limites de validation.
