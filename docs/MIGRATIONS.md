# Migrations

1. `npx supabase migration new <name>` → write SQL in `supabase/migrations/`.
2. `npm run db:reset` (applies everything + seed + settlement).
3. `npm run db:types` → commit the migration **and** `packages/db/src/database.types.ts`.
4. Add or adjust RLS tests in `supabase/tests/`, then `npm run db:test`.

Rules: never edit a pushed migration. Every new table gets RLS enabled in the same migration.
Settlement-owned columns must not be client-writable (use column grants).
