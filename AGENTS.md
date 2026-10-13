<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ausculta — mémoire du projet (à lire avant toute tâche)

La connaissance du projet (contexte, décisions, périmètre, règles, dette, état courant) vit dans le
vault Obsidian **`../Ausculta`** (`~/Desktop/Ausculta`), pas dans ce dépôt. Le code reste la source
de vérité technique : en cas de contradiction, le code a raison et la note doit être corrigée.

Avant de commencer :
1. Lire `../Ausculta/00 - Protocole agents.md` (règles de lecture et de mise à jour).
2. Lire `../Ausculta/00 - État du projet.md` (branche, périmètre actif, chantiers, points d'attention).
3. Ouvrir la note du module concerné dans `../Ausculta/04 Modules/` et les ADR liés dans `06 Décisions/`.

Règles non négociables (détail dans le vault) :
- Seul le module ECOS est actif (`lib/features.ts`) ; ne pas réactiver un module sans décision.
- Toute écriture en base passe par `service_role` + RPC `security definer` ; les clients n'ont que `select`.
- Toute route API : `requireAuthenticatedUser` + `assertSameOrigin` + rate limit.
- Jamais le nom de marque en dur : `@/lib/brand`. Jamais de renumérotation d'un code `station-NN`.
- Rien de sensible vers le navigateur (diagnostic, réponses scriptées, grille, `is_correct`, clés).
- Les tests figent 156 fiches, 870 questions, 23 stations, 22 points, 780 s : lire le test avant de « corriger ».
- Vérifier avec `npm run typecheck && npm run lint && npm test` (et `npm run verify` avant déploiement).

Après la tâche, mettre à jour le vault : une entrée `08 Journal/AAAA-MM-JJ <titre>.md` (template
`_templates/Journal.md`), les notes de module touchées (`updated:`), `00 - État du projet.md` si le
périmètre change, un ADR (`_templates/ADR.md`) pour toute décision structurante, et la ligne de commit
dans `08 Journal/Historique des commits.md`.
