begin;

-- ---------------------------------------------------------------------------
-- Revue de sécurité du 2026-10-13 : `ecos_sessions.station_slug` nomme le
-- diagnostic (« meningite-aigue », « fracture-col-femoral »…). Le rôle
-- `authenticated` avait `select` sur toutes les colonnes de `ecos_sessions`
-- et `ecos_messages` (20260810150000), filtré par RLS sur ses propres lignes :
-- un étudiant pouvait donc lire le diagnostic de sa station en cours via
-- PostgREST, en contournant les codes neutres `station-NN` (ADR-004).
--
-- L'application ne lit jamais ces deux tables depuis le navigateur : toutes
-- les lectures passent par service_role (routes API, tableau de bord,
-- administration). Le `select` est retiré entièrement, et les policies
-- devenues inertes sont supprimées.
-- ---------------------------------------------------------------------------

revoke select on public.ecos_sessions, public.ecos_messages from anon, authenticated;

drop policy if exists "ecos_sessions_select_own" on public.ecos_sessions;
drop policy if exists "ecos_messages_select_own" on public.ecos_messages;

commit;
