/**
 * Podmates tree engine — the ONLY place tree health, growth and streaks are
 * computed. Pure functions, no I/O, no clock: callers pass state in
 * and persist what comes out (apps/api settlement), or show it (mobile forecast).
 *
 * The game, per pod and per pod-day:
 *   everyone snapped on time   → THRIVE: tree gains HP, its max HP grows, growth +1
 *   ≥ 70% snapped on time      → STEADY: tree holds
 *   < 70% snapped on time      → WILT:   tree loses HP, more the fewer showed up
 *   HP reaches 0               → the tree dies; the pod can replant
 * Every on-time snap extends its author's 🔥 streak.
 *
 * Rest days: a member who declared rest (and didn't snap) keeps their streak and is left out
 * of that day's count, so the pod is not punished for it. If everyone rests, the tree holds.
 */

export const RULES = {
  startHp: 100,
  startMaxHp: 100,
  /** Share of members that must snap for the tree to hold steady. */
  steadyThreshold: 0.7,
  /** HP gained on a perfect day (capped at the new max). */
  thriveHp: 15,
  /** Max HP added on a perfect day — the tree gets stronger. */
  thriveMaxHp: 5,
  /** HP lost when nobody snaps; scales linearly with the share that missed. */
  wiltMaxLoss: 40,
} as const

export type TreeStatus = 'alive' | 'dead'
export type DayOutcome = 'thrive' | 'steady' | 'wilt' | 'dormant'

export interface TreeState {
  hp: number
  maxHp: number
  /** Number of perfect days the tree has lived through; drives its stage. */
  growth: number
  status: TreeStatus
}

export interface MemberDay {
  userId: string
  /** Streak before this day. */
  streak: number
  /** Longest streak before this day (defaults to the current streak). */
  bestStreak?: number
  contributed: boolean
  /** Declared a rest day. Ignored if they snapped anyway. */
  rested?: boolean
}

export interface MemberUpdate {
  userId: string
  /** Streak after this day. */
  streak: number
  /** Longest streak ever, after this day. Never goes down. */
  bestStreak: number
}

export interface SettleResult {
  outcome: DayOutcome
  contributors: number
  /** Members counted for the tree (everyone minus those resting). */
  members: number
  /** Members who rested (and didn't snap). */
  resting: number
  hpDelta: number
  maxHpDelta: number
  growthDelta: number
  died: boolean
  tree: TreeState
  memberUpdates: MemberUpdate[]
  /** One line for the pod chat. */
  summary: string
}

export function newTree(): TreeState {
  return { hp: RULES.startHp, maxHp: RULES.startMaxHp, growth: 0, status: 'alive' }
}

export function outcomeFor(contributors: number, members: number): Exclude<DayOutcome, 'dormant'> {
  if (members <= 0) return 'steady'
  if (contributors >= members) return 'thrive'
  return contributors / members >= RULES.steadyThreshold ? 'steady' : 'wilt'
}

/** HP change before capping. Wilt loss is ceil(maxLoss × missed share), so any wilt costs at least 1. */
export function rawHpDelta(contributors: number, members: number): number {
  const outcome = outcomeFor(contributors, members)
  if (outcome === 'thrive') return RULES.thriveHp
  if (outcome === 'steady') return 0
  const missedShare = 1 - contributors / members
  return -Math.ceil(RULES.wiltMaxLoss * missedShare)
}

/** "If the day ended right now" — what the tree screen shows live. */
export function forecast(tree: TreeState, contributors: number, members: number) {
  if (tree.status === 'dead') return { outcome: 'dormant' as const, hpDelta: 0, hpAfter: 0 }
  const outcome = outcomeFor(contributors, members)
  const maxHp = tree.maxHp + (outcome === 'thrive' ? RULES.thriveMaxHp : 0)
  const hpAfter = clamp(tree.hp + rawHpDelta(contributors, members), 0, maxHp)
  /** How many more snaps today would reach the next better outcome. */
  const toSteady = Math.max(0, Math.ceil(members * RULES.steadyThreshold) - contributors)
  const toThrive = Math.max(0, members - contributors)
  return { outcome, hpDelta: hpAfter - tree.hp, hpAfter, toSteady, toThrive }
}

/** Resting only counts when they didn't snap: a snap always wins. */
const isResting = (m: MemberDay) => !!m.rested && !m.contributed

export function settleDay(tree: TreeState, members: MemberDay[]): SettleResult {
  const contributors = members.filter((m) => m.contributed).length
  const resting = members.filter(isResting).length
  const total = members.length - resting

  if (tree.status === 'dead') {
    return {
      outcome: 'dormant',
      contributors,
      members: total,
      resting,
      hpDelta: 0,
      maxHpDelta: 0,
      growthDelta: 0,
      died: false,
      tree,
      memberUpdates: members.map((m) => ({ userId: m.userId, streak: m.streak, bestStreak: Math.max(m.bestStreak ?? 0, m.streak) })),
      summary: 'The tree is resting. Replant it to start growing again.',
    }
  }

  const outcome = outcomeFor(contributors, total)
  const maxHpDelta = outcome === 'thrive' ? RULES.thriveMaxHp : 0
  const growthDelta = outcome === 'thrive' ? 1 : 0
  const maxHp = tree.maxHp + maxHpDelta
  const hp = clamp(tree.hp + rawHpDelta(contributors, total), 0, maxHp)
  const died = hp === 0
  const next: TreeState = { hp, maxHp, growth: tree.growth + growthDelta, status: died ? 'dead' : 'alive' }

  const memberUpdates = members.map((m) => {
    const streak = m.contributed ? m.streak + 1 : isResting(m) ? m.streak : 0
    return {
      userId: m.userId,
      streak,
      bestStreak: Math.max(m.bestStreak ?? 0, m.streak, streak),
    }
  })

  return {
    outcome,
    contributors,
    members: total,
    resting,
    hpDelta: hp - tree.hp,
    maxHpDelta,
    growthDelta,
    died,
    tree: next,
    memberUpdates,
    summary: summarize(outcome, contributors, total, hp - tree.hp, died) + (resting && total ? ` ${resting} ${resting === 1 ? 'member rested' : 'members rested'}.` : ''),
  }
}

function summarize(outcome: DayOutcome, contributors: number, members: number, hpDelta: number, died: boolean) {
  if (members === 0) return 'Everyone rested. The tree held steady.'
  if (died) return `Only ${contributors} of ${members} showed up. The tree didn't make it.`
  if (outcome === 'thrive') return `Everyone showed up! The tree grew${hpDelta > 0 ? ` +${hpDelta} HP` : ''}.`
  if (outcome === 'steady') return `${contributors} of ${members} showed up. The tree held steady.`
  return `Only ${contributors} of ${members} showed up. The tree lost ${-hpDelta} HP.`
}

/**
 * Perfect-day streak for a group (a podmate pair's 🔥): consecutive days everyone
 * snapped. A day when everyone rested (`counted` = 0) holds it, like a rest day holds a
 * personal streak. Any other day, including a dead tree's dormant days, resets it.
 */
export function perfectStreak(previous: number, outcome: DayOutcome, counted?: number): number {
  if (counted === 0 && outcome !== 'dormant') return previous
  return outcome === 'thrive' ? previous + 1 : 0
}

export const STAGES = [
  { minGrowth: 0, name: 'Seed' },
  { minGrowth: 2, name: 'Sprout' },
  { minGrowth: 5, name: 'Sapling' },
  { minGrowth: 10, name: 'Young tree' },
  { minGrowth: 20, name: 'Grown tree' },
  { minGrowth: 40, name: 'Ancient tree' },
] as const

export function stageFor(growth: number) {
  let index = 0
  for (let i = 0; i < STAGES.length; i++) if (growth >= STAGES[i]!.minGrowth) index = i
  const next = STAGES[index + 1]
  return {
    level: index + 1,
    levels: STAGES.length,
    name: STAGES[index]!.name,
    /** Perfect days until the next stage, or null at the top. */
    toNext: next ? next.minGrowth - growth : null,
  }
}

/** 0–1 health ratio for bars. */
export const healthRatio = (tree: Pick<TreeState, 'hp' | 'maxHp'>) => (tree.maxHp > 0 ? clamp(tree.hp / tree.maxHp, 0, 1) : 0)

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
