# Architecture

## The pieces

```
┌──────────── apps/mobile (Expo Go) ────────────┐         ┌──── apps/api (Express) ────┐
│ screens → features/*/hooks (TanStack Query)   │  JWT    │ /v1/pods/:id/replant       │
│   reads/writes Supabase directly under RLS ───┼────┐    │ /v1/dev/* (local only)     │
│   lib/api.ts → the few privileged calls ──────┼────┼───▶│ settlement worker (60s)    │
│   tree-engine.forecast() for the live headline│    │    │   └ tree-engine.settleDay()│
└───────────────────────────────────────────────┘    │    └─────────────┬──────────────┘
                                                     ▼                  │ secret key
                         ┌──────────── Supabase (Docker) ────────────┐  │
                         │ Postgres + RLS · Auth · Realtime · Storage │◀─┘
                         │ triggers: snaps_before/after_insert        │
                         │ RPCs: create_pod, join_pod,                │
                         │       apply_day_settlement (service only)  │
                         └────────────────────────────────────────────┘
```

As in TariffsCANner, **most traffic skips the API**. The app talks to Postgres with the user's JWT,
and RLS is the authorization layer. The API exists for work that needs server privileges: settling
days and replanting trees.

## How a snap becomes tree health

1. **Reminder.** `lib/notifications.ts` schedules one daily local notification per pod at its
   `snap_time`, converted from the pod's timezone to the device's (`snapTimeIn`). Tapping it opens the
   camera with that pod preselected.
2. **Capture.** `(tabs)/camera.tsx` uses `expo-camera`. The Simulator has no camera, so it shows the
   library / demo-photo fallback instead. → `send.tsx` picks pods; open windows are preselected.
3. **Upload once, post many.** `useSendSnap` resizes the image to 1080px JPEG, uploads it to
   `snaps/<user_id>/<uuid>.jpg`, and inserts one `snaps` row per chosen pod.
4. **Server decides.** `snaps_before_insert` stamps `taken_at = now()`, `pod_date` (pod-local date),
   `habit_id` (from the pod) and `on_time` (`snap_time ≤ local time < snap_time + window`). Client
   values are ignored. `snaps_after_insert` posts a `snap` message to the chat and, if on time, inserts the
   day's `contributions` row (first one wins).
5. **Live.** Realtime pushes the new message, so chats, the pod list and tree screens refetch.
6. **Settlement.** Every 60s the worker (`services/settlement.ts`) finds pod-days that have ended
   (`trees.last_settled_date` < yesterday in the pod's zone). For each day it gathers members and
   contributions, then calls `settleDay()` from `packages/tree-engine`. It persists the result with
   `apply_day_settlement()`: tree HP/max/growth/status, a `pod_days` log row, per-member energy/stars/streak,
   and a system chat message, all in one transaction guarded by `last_settled_date = expected`, so
   two workers can never double-settle. Then `refresh_profile_stats()` re-aggregates profiles.

The tree screen's headline ("2 more snaps or the tree loses 14 HP tonight") is `forecast()` from
the same engine, run on the client, so the prediction and the outcome can't disagree.

## Data model (public schema)

| Table | What | Written by |
|---|---|---|
| `profiles` | person + aggregates (energy, stars, streak) | user (presentation columns), settlement (stats) |
| `habits` | catalogue (Reading, Running…) and the top tabs | seed |
| `pods` | a habit group: goal, `snap_time`, `window_minutes`, `timezone`, invite code | `create_pod` RPC |
| `pod_members` | membership + per-pod energy/stars/streak | `create_pod`/`join_pod`, settlement |
| `trees` | one per pod: hp, max_hp, growth, status, last_settled_date | settlement, replant |
| `pod_days` | settlement log, one row per pod-day | settlement |
| `snaps` | photo proof; `on_profile` = shown on the profile grid | user (+ trigger) |
| `contributions` | first on-time snap per member per pod-day | trigger |
| `messages` | chat: text / snap / system | user (text), triggers, settlement |
| `snap_views` | story seen-state | user |
| `communities`, `community_members`, `posts`, `post_votes`, `comments` | Explore | user (+ counter triggers) |
| view `pod_overview` | chat-list read model (security_invoker) | — |

## Mobile app structure

```
src/app/                    routes (expo-router)
  (tabs)/_layout.tsx        NativeTabs → iOS 26 Liquid Glass pill, icon-only
  (tabs)/index|explore|camera|profile.tsx
  pod/[id]/index.tsx        chat thread         pod/[id]/tree.tsx   tree (fullScreenModal)
  story/[userId].tsx        stories viewer      snap/[id].tsx       single snap
  send.tsx · pod/new.tsx · profile/edit.tsx · profile/pick.tsx · post/new.tsx   (formSheets)
  user/[id].tsx · community/[slug].tsx · post/[id].tsx · sign-in.tsx
src/features/<name>/        hooks.ts (data) + components/ (UI) for pods, snaps, tree, profile, explore
src/components/ui/          primitives: Text, Icon, Avatar, Button/ChunkyButton, HealthBar, Chip, Header…
src/lib/                    env, supabase, api, keys, realtime, notifications, haptics, format, nav
```
