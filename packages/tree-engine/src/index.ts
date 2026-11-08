/**
 * Podmates rules engine: the ONLY place streaks, tree health and tree stage are computed.
 * Pure functions, no I/O, no clock: callers pass history in and persist what comes out
 * (apps/api settlement) or show it (the app). See docs/PRODUCT_SPEC.md §3.
 *
 * The game, per user and habit:
 *   a verified snap that day → streak +1
 *   a declared rest day      → streak holds (max 2 per Monday–Sunday week)
 *   neither                  → streak back to 0
 * Per pod:
 *   tree health = members on an active streak ÷ members counted (resting members are left out)
 *   tree stage  = grows with the pod's lifetime verified snaps; it never shrinks or dies
 */

export const RULES = {
  /** Declared rest days allowed per habit per Monday–Sunday week. Mirrored in SQL (declare_rest). */
  restDaysPerWeek: 2,
  /** Flags that hide a snap pending team review. Mirrored in SQL (snap_flags trigger). */
  flagsToHide: 5,
} as const

/** Tree stages by the pod's lifetime verified snaps. */
export const STAGES = [
  { minSnaps: 0, name: 'Seed' },
  { minSnaps: 25, name: 'Sprout' },
  { minSnaps: 100, name: 'Sapling' },
  { minSnaps: 300, name: 'Young tree' },
  { minSnaps: 1000, name: 'Grown tree' },
  { minSnaps: 3000, name: 'Ancient tree' },
] as const

/** What a day counted as for one user and habit. Days with no entry were missed. */
export type DayStatus = 'snapped' | 'rest'

export interface Streak {
  current: number
  best: number
}

// ─── Dates ('YYYY-MM-DD', calendar only, no timezones) ───────────────────────

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7))
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

/**
 * Replays a user's history for one habit from `from` through `through` (inclusive) and returns
 * the streak at the end plus the best streak seen. Recomputing from history (rather than adding
 * to a stored number) makes settlement safe to re-run and lets a rejected snap fix itself.
 */
export function settleStreak(days: Readonly<Record<string, DayStatus>>, from: string, through: string): Streak {
  let current = 0
  let best = 0
  for (let d = from; d <= through; d = addDays(d, 1)) {
    const status = days[d]
    if (status === 'snapped') current += 1
    else if (status !== 'rest') current = 0
    best = Math.max(best, current)
  }
  return { current, best }
}

/** The streak to show right now: settled through yesterday, plus today if already snapped. */
export function liveStreak(settled: number, today: DayStatus | null): number {
  return today === 'snapped' ? settled + 1 : settled
}

/** Rest days still available this week, given how many were used since Monday. */
export function restDaysLeft(usedThisWeek: number): number {
  return Math.max(0, RULES.restDaysPerWeek - usedThisWeek)
}

// ─── Trees ────────────────────────────────────────────────────────────────────

export interface MemberToday {
  /** Streak settled through yesterday. */
  settledStreak: number
  /** What today counts as so far (null = nothing yet; the day isn't over). */
  today: DayStatus | null
}

export interface TreeHealth {
  /** 0–1. */
  health: number
  active: number
  counted: number
}

/**
 * Share of a pod's members on an active streak. Snapped today → active. Resting today → left out
 * of both numbers. Nothing yet today → active if their streak is still alive (the day isn't over).
 * A pod with nobody counted is fully healthy: there is nothing to lose.
 */
export function treeHealth(members: readonly MemberToday[]): TreeHealth {
  let active = 0
  let counted = 0
  for (const m of members) {
    if (m.today === 'rest') continue
    counted += 1
    if (m.today === 'snapped' || m.settledStreak > 0) active += 1
  }
  return { health: counted ? active / counted : 1, active, counted }
}

/** Stage from the pod's lifetime verified snaps. `toNext` is null at the top stage. */
export function stageFor(totalSnaps: number) {
  let index = 0
  for (let i = 0; i < STAGES.length; i++) if (totalSnaps >= STAGES[i]!.minSnaps) index = i
  const next = STAGES[index + 1]
  return {
    level: index + 1,
    levels: STAGES.length,
    name: STAGES[index]!.name,
    nextName: next?.name ?? null,
    toNext: next ? next.minSnaps - totalSnaps : null,
  }
}

/** Plain-language health band for labels and colours. */
export function healthBand(health: number): 'thriving' | 'okay' | 'struggling' {
  if (health >= 0.75) return 'thriving'
  if (health >= 0.4) return 'okay'
  return 'struggling'
}
