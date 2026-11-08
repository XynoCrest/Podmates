# Podmates

A habit tracker that works like a group chat. You join a **pod** with a few friends to build one
habit (reading a book, running, swimming…). Every day at the pod's snap time everyone gets a
reminder and has **15–30 minutes to snap a photo as proof**. Each pod grows a **tree**
together: when everyone shows up, it grows; if fewer than 70% show up, it wilts; at 0 HP it dies.

> **Status: working MVP on local infrastructure.** Everything runs on your laptop in Docker plus the
> iOS Simulator. Nothing is hosted and you don't need any accounts. Seed photos are placeholders from
> picsum.photos. See [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md).

---

## Quick start (macOS, iOS Simulator + Expo Go)

**Prerequisites:** Node 22+, Docker Desktop (running), Xcode with an iOS Simulator.

```bash
npm install            # every workspace (apps + packages), one lockfile
npm run db:start       # local Supabase in Docker: Postgres, Auth, Realtime, Storage (ports 553xx)
npm run env:local      # writes apps/api/.env.local and apps/mobile/.env.local from the local stack
npm run db:reset       # migrations + demo seed, then replays 12 days of tree history
```

Then run these in two terminals:

```bash
# terminal 1: API + settlement worker on http://localhost:4100
npm run dev:api

# terminal 2: Expo / Metro. Press `i` to open the iOS Simulator in Expo Go
cd apps/mobile && npx expo start
```

The app runs in **Expo Go**, which is installed into the Simulator for you. You don't need an Apple
developer account or a native build. Sign in with one of the **demo account** bubbles. Ben is in 5 pods.

Run `npm run smoke` to check the whole backend in one command. It covers sign-in → RLS →
open window → upload → on-time snap → contribution → end of day → tree settled.

**Share with anyone, on any network:** stop `expo start`, then run `npm run tunnel` (needs
`brew install cloudflared`, with `db:start` and `dev:api` running). It prints an `exps://…trycloudflare.com`
link and a QR code for Expo Go. ⚠ This exposes your local Supabase, which uses well-known default
keys, to the internet. Keep only test data in it and press Ctrl+C when you're done.

**Physical iPhone on the same Wi-Fi:** run `npm run env:local -- --lan` first so the phone can reach your Mac. Then scan
the QR code from `npx expo start` with the Camera app. The real camera works there.

### Demo script (≈2 minutes)

1. **Pods tab** → the *Reading* pill has a dot, and the amber banner says *Atomic Habits Club* has
   its snap window open. The seed always opens it 5 minutes before your reset.
2. Tap a story bubble (Maya, Theo) to watch their snaps from the last 24h.
3. Tap **Atomic Habits Club** → the chat. Tap the tree at the top right → the **tree screen**. It shows the
   stage, health, what last night did, how today scores, and who has snapped; the pill on top says what tonight will do.
4. Tap **Snap now** → the camera. In the Simulator, choose **Use a demo photo** → the **Send to**
   sheet preselects pods with open windows → Send. The chat shows your snap with ✓ On time.
5. Back on the tree, scroll to **Demo tools** → **End the day now**. The tree engine settles today:
   everyone snapped, so the tree grows and you earn ⭐.
6. Open **Night Owl Readers**' tree: 41 HP and wilting. **Open window now** lets you snap for it.
7. **Profile tab**: ⚡ energy / ⭐ stars / 🔥 streak, one icon tab per habit, and a 3:4 grid of the
   snaps you chose. Use **Pick snaps** to choose more.
8. **Explore tab**: search communities, your communities, posts from every community (Hot / New / Top), voting, comments, join.

To try two people at once, open a second Simulator and use
`xcrun simctl openurl <device> "exp://127.0.0.1:8081/--/sign-in?demo=maya"`. Chat and tree updates
arrive live over Supabase Realtime.

---

## Repo map

```
apps/
  mobile/        Expo SDK 58 app (expo-router, TanStack Query)          → Expo Go / EAS
  api/           Express 5 API + in-process settlement worker                          → Docker
packages/
  tree-engine/   the ONLY place tree HP, growth, energy, stars and streaks are computed (pure, tested)
  shared/        contracts: zod API schemas, error codes, snap-window + pod-date maths
  db/            generated Supabase types + server-only client factory
  ui-tokens/     design tokens (Tailwind preset + raw values), light
supabase/
  migrations/    schema, triggers, RLS, storage, settlement RPC (SQL, committed)
  seed.sql       6 demo people, 6 pods, 12 days of snaps, chat, communities, posts
  tests/         pgTAP RLS tests
scripts/         env:local writer, end-to-end smoke test
docs/            architecture, game rules, design, environment, migrations, invariants, placeholders
```

## Everyday commands (repo root)

| Command | What it does |
|---|---|
| `npm run db:start` / `db:stop` | Start or stop local Supabase (Studio at http://127.0.0.1:55323) |
| `npm run db:reset` | Rebuild the DB from migrations + seed, then settle the seeded days |
| `npm run db:types` | Regenerate `packages/db/src/database.types.ts` after a schema change |
| `npm run db:test` | RLS tests (pgTAP) |
| `npm run env:local` | Write local `.env.local` files (`-- --lan` for a physical phone) |
| `npm run dev:api` | API + settlement worker, with reload |
| `npm run settle` | Settle every pod-day that has ended (the same thing the worker does) |
| `npm run typecheck` / `npm test` | Every workspace |
| `npm run smoke` | End-to-end check against the running stack |
| `npm run tunnel` | Cloudflare tunnels for API + Supabase + Metro, then Expo; prints a shareable `exps://` Expo Go link |

## Where to read next

| You want to… | Read |
|---|---|
| Understand how a snap becomes tree health | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Change the game (HP, thresholds, stages) | [docs/GAME_RULES.md](docs/GAME_RULES.md) |
| See the UI references and design decisions | [docs/DESIGN.md](docs/DESIGN.md) |
| Know what's fake right now | [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md) |
| Change the database | [docs/MIGRATIONS.md](docs/MIGRATIONS.md) |
| Know what must not be "cleaned up" | [docs/INVARIANTS.md](docs/INVARIANTS.md) |
| Set env vars or fix setup problems | [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) |
| Work with an AI coding agent | [AGENTS.md](AGENTS.md) |
