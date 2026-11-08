# Game rules

All numbers live in `RULES` in [`packages/tree-engine/src/index.ts`](../packages/tree-engine/src/index.ts).
Change them there (and in its tests). Nothing else computes them.

## Each day, per pod

The **pod-day** is the pod's local calendar date. A member **contributes** with an on-time snap,
which means one taken inside the window `[snap_time, snap_time + window_minutes)`. Late snaps still
post to the chat, marked LATE, but don't count.

| Share of members who contributed | Outcome | Tree |
|---|---|---|
| 100% | **Thrive** | +15 HP, max HP +5, growth +1, each contributor gets ⭐ +1 |
| ≥ 70% | **Steady** | no change |
| < 70% | **Wilt** | −⌈40 × share that missed⌉ HP (e.g. 2 of 3 → −14, nobody → −40) |
| HP reaches 0 | **Dead** | the tree stops changing ("dormant") until the pod **replants** (fresh 100/100 seed) |

Every contributor earns **⚡ +10 energy**, and their **🔥 streak** goes up by 1. Anyone who missed
the day goes back to streak 0. Only people who had joined by the end of that day count.

## Stages (by growth = number of perfect days)

| Growth | 0 | 2 | 5 | 10 | 20 | 40 |
|---|---|---|---|---|---|---|
| Stage | Seed | Sprout | Sapling | Young tree | Grown tree | Ancient tree |

The illustration (`features/tree/TreeArt.tsx`) is drawn from the stage and from health
(hp / max_hp): leaves go green → yellow → brown as health drops, and a dead tree is bare.

## Profile stats

- **Energy**: lifetime ⚡ across all pods.
- **Stars**: lifetime ⭐ (perfect days).
- **Streak**: the best *current* streak across your pods.
