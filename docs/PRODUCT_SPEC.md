# Podmates product spec: kind accountability

**Status:** built on `feature/maria_spec` (phases 1–5 of the build plan below). Docs rewrite (phase 6) not done yet.
**Base:** `feat/ui-rework-og` (dark theme; tabs Home, Explore, Snap, Profile; green streak hero on Home).
**Owner:** Maria. Decisions come from a product interview on 2026-11-07.

The current code implements a different model: small private friend pods, a shared tree that wilts
when fewer than 70% snap, and energy and stars. This spec replaces that model. The
[delta table](#what-changes-from-today) lists every change, and the [build plan](#build-plan) orders the work.

---

## 1. The idea in one paragraph

Podmates is a **kind** habit app. You pick habits from a fixed list. Each habit has one open community
called a **pod** (the Reading pod, the Swimming pod). You keep a **personal streak per habit** by posting
one live photo a day, any time that day. Life happens, so you can **declare up to two rest days a week**
without losing your streak. Each pod has **one tree**: its health is the share of the pod's members
who are keeping their streak, and it grows bigger as the pod posts more verified snaps. There are no
group penalties, no leaderboards between groups, and no energy or stars.

## 2. Concepts

| Concept | Definition |
|---|---|
| **Habit** | An entry in a fixed, team-curated list (Reading, Swimming, Running, …). Users can't create habits. |
| **Pod** | The single community for one habit. One pod per habit. "Community" and "pod" are the same thing. |
| **Membership** | Adding a habit joins its pod. Removing the habit leaves the pod. No invite codes. |
| **Snap** | A live photo taken in-app, posted to one or more of your habits. Visible to everyone in those pods. |
| **Day** | A calendar day in the **user's own timezone** (open question Q1). |
| **Streak** (per habit) | Consecutive days with a verified snap **or** a declared rest day. |
| **Rest day** | Declared ("Rest today") before the day ends. Max **2 per week** per habit (week definition: Q2). Keeps the streak; doesn't add to it (Q3). |
| **Miss** | A day with no verified snap and no declared rest. Resets that habit's streak to 0. |
| **Tree** | One per pod. **Health** = members with an active streak ÷ members counted that day. Members resting that day are left out of both numbers. **Size (stage)** = the pod's lifetime count of verified snaps. The tree never dies and never shrinks. |
| **Flag** | Any pod member can flag a snap as fake. At **5 flags** it's hidden pending review by the Podmates team. |
| **Follow** | One-way. Private accounts approve followers. |

## 3. Rules (the source of truth for `packages/tree-engine`)

1. **One verified snap per habit per day** counts. Extra snaps post to the pod feed but add nothing.
2. **Verification** = taken with the in-app live camera (no photo library on real phones), and stamped
   by the server. The server, not the client, decides which day a snap belongs to.
3. **Rest days:** a user taps "Rest today" for a habit. The server refuses a third rest day in the same week.
4. **End of day** (per user, per habit): snapped → streak +1; rested → streak unchanged; neither → streak = 0.
5. **Best streak** is kept per habit and never decreases.
6. **Tree health (per pod, per day):** `active ÷ (members − resting)`, where *active* = members whose streak
   is above 0 after the day settles. A pod with no counted members shows as healthy (Q4).
7. **Tree stage (per pod):** thresholds on lifetime verified snaps (numbers: Q5).
8. **Flags:** one flag per person per snap. At 5 flags the snap is hidden from feeds. While under review, the
   day still counts toward the streak (Q6). If the team rejects it, the day is removed and the streak recalculated.

## 4. Screens

| Tab / screen | Contents |
|---|---|
| **Home** | Green streak hero: "You're on an N-day streak!" for the **selected habit**, plus the **healthiest tree among your pods**. Habit tabs (+ adds a habit). Story circles: snaps from **people you follow** in that habit, last 24h. Below: the habit's pod card (tree health, today's activity) and your follow list. |
| **Pod page** | Reddit-like feed for one habit: snaps and posts, posts with up and down votes, cheers on snaps. "New post" button. No group chat. |
| **Explore** | Top: discover pods (browse and search habits; add one). Below: trending posts and snaps from all pods. |
| **Snap** | Live camera. After shooting, pick which habit(s) it counts for and add an optional caption, then post. |
| **Profile** | Current streak per habit. KPI cards: consistency % (last 30 days, snapped or rested), number of habits. Snap grid (the snaps you chose to show), one tab per habit. Edit profile; private profile switch; follow requests. |
| **Onboarding** | Pick habits (joins those pods) → set an optional reminder time per habit → 3-screen tour (streaks, rest days, trees). |
| **Direct messages** | Kept from `feat/ui-rework-og`, but **only between people who follow each other** (today: anyone sharing a pod). |

**Reminders:** optional per-habit reminder at a time you choose, plus an evening "still time today"
nudge for habits not done yet.

**Theme:** dark, as on `feat/ui-rework-og`.
**Sign-in:** unchanged (email and password).

## 5. Social and safety

| Feature | Decision |
|---|---|
| Who sees a snap | Everyone in the habit's pod |
| Reactions | Cheers on snaps (positive only); up and down votes on posts |
| Follows | Yes; private accounts approve follow requests |
| DMs | Mutual follows only |
| Fake snaps | Flags, 5 to hide, team review |
| Private profile | Yes |
| Block / report / delete account | **Not in scope (decided).** Flagged as a risk: pods are open, so strangers see your snaps. Revisit before public launch. |

## 6. What changes from today

| Area | Today (`feat/ui-rework-og`) | Spec |
|---|---|---|
| Pods | Private groups of 3–5, invite code, chat | One open pod per habit; feed, not chat |
| Explore | Separate communities (Bookworms, Swimmers…) | Discover pods + trending; communities merge into pods |
| Streak | Per pod; only inside a 15–30 min shared window | Per habit; any time that day |
| Missing a day | Resets streak; group tree loses HP | Resets streak unless you declared rest; tree only reflects the share still on a streak |
| Tree | Shared HP, wilts below 70%, can die, replant | Health = share on a streak; size = total snaps; never dies |
| Energy and stars | On profiles, pod members, tree screen, settlement | Removed everywhere |
| Proof | Library allowed | Live camera only on phones; flags |
| Social | Pod chat, DMs with podmates | Follows, cheers, post votes, DMs between mutual follows |
| Home tree | Decorative drawing | Healthiest of your pods' trees |
| Reminders | One per pod at its window | Optional per habit + evening nudge |
| Onboarding | None | Habits, reminders, tour |

## 7. Build plan

Each phase leaves `npm run typecheck`, `npm test`, `npm run db:test` and `npm run smoke` green.
Follow AGENTS.md: new migrations only (never edit pushed ones), regenerate types, and keep every tree
and streak number in `packages/tree-engine`.

| Phase | Work | Main files |
|---|---|---|
| **1. Data model** | New migration(s): one pod per habit (seed one per habit; drop invite codes, snap times and windows); merge communities into pods (`posts.pod_id`); `user_habits` (user, habit, reminder time, current and best streak); `habit_days` (user, habit, day, `snapped` or `rest`); snap flags and a `hidden` state; follows (with pending state) and `profiles.is_private`; cheers; DM rule changed to mutual follows; drop energy and stars columns. New RLS policies and pgTAP tests for each. | `supabase/migrations/2026…_kind_model.sql`, `supabase/tests/rls_test.sql`, `supabase/seed.sql`, `packages/db` types |
| **2. Rules engine** | Replace the HP/wilt model with: `settleHabitDay` (streak rules), `treeHealth`, `treeStage`, rest-day limit check. Full tests. | `packages/tree-engine` |
| **3. Server jobs** | Snap trigger stamps the user's day (not a pod window). Daily settlement per user and habit at the end of the user's day; daily tree health per pod. Flag-review endpoint for the team. | snap trigger migration, `apps/api/src/services/settlement.ts`, worker |
| **4. Screens** | Home (hero, healthiest tree, habit tabs, follows' stories) → pod feed → Snap flow (habit picker after capture) → Profile (streaks, KPIs, grid, private) → Explore (discover + trending). Remove energy and stars from all screens. | `apps/mobile/src/app/**`, `features/**` |
| **5. Onboarding, reminders, safety** | Onboarding flow; per-habit and evening reminders; follow requests; flag UI. | new routes, `lib/notifications.ts` |
| **6. Docs** | Rewrite GAME_RULES.md, ARCHITECTURE.md, INVARIANTS.md, DESIGN.md, README demo script. | `docs/`, `README.md` |

## 8. Open questions

| # | Question | Default if nobody objects |
|---|---|---|
| Q1 | When does a day end? | Midnight in the user's own timezone |
| Q2 | Which week do rest days reset on? | Monday to Sunday, user's timezone |
| Q3 | Does a rest day add +1 to the streak or hold it? | Holds it (no +1) |
| Q4 | Tree health in a pod where nobody is counted that day? | Shows as 100% (nothing to lose) |
| Q5 | Snaps needed per tree stage (seed → full)? | Not set; needs a decision |
| Q6 | Does a flagged, hidden snap count while under review? | Yes, until the team rejects it |
| Q7 | Who is "the team" that reviews flags, and with what tool? | Not set |
| Q8 | What happens to existing friend pods, chats and seed data? | Seed is rebuilt for the new model; old tables dropped |
| Q9 | Up and down votes on posts vs the "kind" direction? | Kept, as decided; revisit if it causes pile-ons |
