# AGENTS.md

Instructions for coding agents and new teammates. Read this before changing anything.

## Layout

```
apps/mobile      Expo SDK 58 / RN 0.88, expo-router   (see apps/mobile/AGENTS.md for Expo rules)
apps/api         Express 5 API + in-process settlement worker     (Docker)
packages/*       tree-engine, shared, db, ui-tokens                (TypeScript source, no build step)
supabase/        migrations, seed, pgTAP tests
```

npm workspaces, with one lockfile at the root. Workspace packages ship `.ts` source, and Metro, tsx
and tsup compile them in place.

## Before you change anything: baseline

| Command (repo root) | Expected |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | all green |
| `npm run db:test` | 12/12 RLS tests pass |
| `npm run smoke` (stack running) | "All good ✅" |

## Never do these

- **Never compute tree HP, growth, energy, stars or streaks outside `packages/tree-engine`.** The API
  settles with it and the app forecasts with it. SQL only persists results (`apply_day_settlement`).
- **Never decide "on time" on the client.** The `snaps_before_insert` trigger stamps `taken_at`,
  `pod_date`, `on_time` and `habit_id` from the server clock and the pod. `packages/shared/src/snapWindow.ts`
  mirrors the rule for countdowns only.
- **Never edit a migration that has been pushed.** Add a new one.
- **Never put a secret behind `EXPO_PUBLIC_`.** It ships inside the app. The Supabase *secret* key
  lives only in `apps/api`.
- **Never add a fallback URL or key.** Missing config must fail loudly (zod in `env.ts`).
- **Never trust identity from request headers or bodies in `apps/api`.** The user comes from the
  verified JWT only. Parse params and bodies with zod.
- **Never mount `/v1/dev/*` outside `APP_ENV=local`.** These are demo helpers (open window, end day).
- **Never run `eas build`, `eas submit` or `eas update`.** A human triggers every EAS action.

## Conventions

- Dates: a *pod-day* is the pod's local calendar date (`pods.timezone`). Times are `HH:MM:SS` in that zone.
- Schema change → new migration → `npm run db:types` → commit both.
- New env var → add it to the app's zod schema **and** its `.env.example`. A test enforces this for the API.
- Tests never depend on the wall clock. Pass an explicit `now`.
- Mobile: features live in `src/features/<name>/` (hooks + components), routes in `src/app/`, and
  primitives in `src/components/ui/`. Colours come from `@podmates/ui-tokens`, with no raw hex in screens
  except pure black/white over photos. Query keys come from `src/lib/keys.ts`.
- PostgREST embeds of `profiles` from `snaps` or `posts` need the FK hint (`profiles!snaps_user_id_fkey`),
  because `snap_views` / `post_votes` / `comments` create a second path.
- Match the surrounding code. Comments say what and why, briefly.

## Where to look first

| Question | File |
|---|---|
| How does a snap become tree health? | `docs/ARCHITECTURE.md` |
| What are the game rules? | `docs/GAME_RULES.md` |
| What is fake right now? | `docs/PLACEHOLDERS.md` |
| What must not be "cleaned up"? | `docs/INVARIANTS.md` |
| Env vars, local setup, troubleshooting | `docs/ENVIRONMENT.md` |
