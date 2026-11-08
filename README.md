# Podmates

A habit app that works like a group chat. You join a **pod**: a few friends building one habit
together (reading, running, swimming, meditating…). Every day at the pod's snap time, everyone has
a **15–30 minute window to snap a photo as proof**. The pod shares one **tree** that grows when
people show up, and the app is built so that missing a day is safe: **rest days** keep your streak,
and nobody is shamed for a miss.

> **Status: working prototype on local infrastructure.** Everything runs on your laptop in Docker
> plus the iOS Simulator. Nothing is hosted and you don't need any accounts. Seed photos are
> placeholders. See [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md) for what's local-only.

## Hack the Change 2026: Prompt 1

**Prompt 1:** *How can we leverage technology to promote health, social connection, and
well-being in our communities?*

| Focus area | How Podmates addresses it |
|---|---|
| **2. Proactive Health & Wellness** (main) | Daily habit tracking with photo proof, personal and pod streaks, and a shared tree that turns consistency into something visible. |
| **1. Community Connection & Inclusion** | You never build the habit alone: pods, pod chat, one-to-one messages between podmates, duo trees, stories and Explore communities for each habit. |

**Well-being by design**
- **Rest days:** 2 per pod per week. Your streak holds, and the pod's tree doesn't count you that day.
- **No public shaming.** The tree shows each person's share of the pod's health rather than a list of who missed.
- **Supportive wording.** A late snap still posts to your pod, so they can see you turned up.

**Safety and trust**
- Leave a pod, or remove a member if you created it.
- Block someone or report a snap, post, comment or profile.
- Delete your account and photos from inside the app.
- All data access is enforced by database row-level security.

## How it works

1. **Start or join a pod.** Pick a habit and a daily snap time, then share the pod's 6-character
   invite code (the pod chat shows it until there are 3 members). Pods hold up to 6 people.
2. **Snap in the window.** The server, not the phone, decides whether a snap is on time. Late
   snaps still post to the chat but don't count.
3. **The tree reacts each night.** These are the pod's members who aren't resting that day:

   | Who snapped on time | Result |
   |---|---|
   | Everyone | Thrive: HP, max HP and growth go up |
   | At least 70% | Steady: no change |
   | Fewer than 70% | Wilt: HP drops, more when fewer show up |

   At 0 HP the tree dies and the pod can replant it. All numbers live in one tested package:
   [docs/GAME_RULES.md](docs/GAME_RULES.md).
4. **Streaks.** Each on-time snap adds a day. A rest day holds it. A miss resets it.

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
developer account or a native build.

**Sign in** with a seeded demo account. These exist only in your local database:

| Email | Password |
|---|---|
| `ben@podmates.dev` (in 5 pods, a good place to start) | `podmates123` |
| `maya@podmates.dev`, `theo@podmates.dev`, `priya@podmates.dev`, `jonas@podmates.dev`, `aisha@podmates.dev` | `podmates123` |

Run `npm run smoke` to check the whole backend in one command. It covers sign-in → RLS → open
window → upload → on-time snap → contribution → end of day → tree settled. It changes local data,
so run `npm run db:reset` afterwards for a clean slate.

**Physical iPhone on the same Wi-Fi:** run `npm run env:local -- --lan` first so the phone can
reach your Mac. Then scan the QR code from `npx expo start` with the Camera app. The real camera
works there.

**Share with anyone, on any network:** stop `expo start`, then run `npm run tunnel` (needs
`brew install cloudflared`, with `db:start` and `dev:api` running). It prints an
`exps://…trycloudflare.com` link and a QR code for Expo Go. ⚠ This exposes your local Supabase,
which uses well-known default keys, to the internet. Keep only test data in it and press Ctrl+C
when you're done.

### Demo script (about 3 minutes, signed in as Ben)

1. **First sign-in:** a short tour explains snap windows, streaks and the shared tree. Then pick
   habits (this joins their Explore communities) and skip the pod step.
2. **Home** shows your streak for the selected habit tab. The *Reading* card says Atomic Habits
   Club's window is open (the seed opens it 5 minutes before your reset). Story bubbles show
   podmates' snaps from the last 24 hours.
3. **Atomic Habits Club** → the pod chat. The strip under the header shows the window and a
   **Rest today** button. The ⋯ menu has rest day, invite, remove a member and leave pod.
4. Tap the 🌳 chip → the **tree screen**: health %, each member's share of it, the last 7 days, and
   a headline saying what tonight will do to the tree.
5. **Snap now** → the camera. In the Simulator, choose **Use a demo photo** → the **Send to** sheet
   preselects pods with open windows → Send. The chat shows your snap marked ON TIME.
6. Back on the tree, scroll to **Demo tools** → **End the day now**. The tree engine settles today
   and posts the result in the chat.
7. Open **Night Owl Readers**' tree: 41 HP and wilting. **Open window now** lets you snap for it.
8. **Profile:** Top streak · Best ever · Snaps, a card per habit (tap it for that habit's
   calendar) and a board of the snaps you chose to show. The ☰ menu has Edit profile, Share, Sign
   out and **Delete account**.
9. **Explore:** community posts (Active / New / Top), voting and comments. Open someone's profile
   and use ⋯ to **report** or **block** them.

To try two people at once, open a second Simulator and run
`xcrun simctl openurl <device> "exp://127.0.0.1:8081/--/sign-in?demo=maya"`. Chat and tree updates
arrive live over Supabase Realtime.

---

## Engineering highlights

- **The server decides what counts.** A database trigger stamps each snap's time and on-time
  status, so changing the phone's clock can't fake it.
- **One rules engine.** Tree health, growth and streaks are computed only in
  `packages/tree-engine`: pure functions with unit tests. The worker settles each pod's finished
  days atomically and idempotently. Re-running a day changes nothing, and one bad pod can't stop
  the others.
- **Row-level security is the authorization layer.** The app talks to Postgres with the user's
  token, and pgTAP tests check the rules: pod privacy, blocks, reports, rest days, removed members
  staying out, and forged timestamps or counts being ignored.
- **Tests:** `npm run typecheck`, `npm test` (unit), `npm run db:test` (RLS) and `npm run smoke`
  (end to end) all pass.

## Known limitations

- Runs locally only: the plan for hosting a Supabase project and container is in
  [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md).
- Photos are in a public bucket with unguessable paths. Production would use a private bucket
  with signed links.
- Reports are saved for review, but there's no moderation screen yet.
- Reminders are local notifications on the phone. There are no server push notifications yet.

---

## Repo map

```
apps/
  mobile/        Expo SDK 58 app (expo-router, NativeTabs, TanStack Query)  → Expo Go / EAS
  api/           Express 5 API + in-process settlement worker                          → Docker
packages/
  tree-engine/   the ONLY place tree HP, growth and streaks are computed (pure, tested)
  shared/        contracts: zod API schemas, error codes, snap-window + pod-date maths
  db/            generated Supabase types + server-only client factory
  ui-tokens/     design tokens (colours, spacing, radii), dark-first
supabase/
  migrations/    schema, triggers, RLS, storage, settlement RPC, safety and rest days (SQL, committed)
  seed.sql       6 demo people, 6 pods, 12 days of snaps, chat, communities, posts
  tests/         pgTAP RLS tests
scripts/         env:local writer, end-to-end smoke test
design/          design normalization audit + page templates guide
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
| Change the game (HP, thresholds, stages, rest days) | [docs/GAME_RULES.md](docs/GAME_RULES.md) |
| See the UI references and design decisions | [docs/DESIGN.md](docs/DESIGN.md) |
| Build a new screen the same way as the rest | [design/normalization/TEMPLATES.md](design/normalization/TEMPLATES.md) |
| Know what's fake right now | [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md) |
| Change the database | [docs/MIGRATIONS.md](docs/MIGRATIONS.md) |
| Know what must not be "cleaned up" | [docs/INVARIANTS.md](docs/INVARIANTS.md) |
| Set env vars or fix setup problems | [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) |
| Work with an AI coding agent | [AGENTS.md](AGENTS.md) |
