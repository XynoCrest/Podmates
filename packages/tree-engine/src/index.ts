/**
 * Podmates tree engine — the ONLY place tree health, growth, energy, stars and
 * streaks are computed. Pure functions, no I/O, no clock: callers pass state in
 * and persist what comes out (apps/api settlement), or show it (mobile forecast).
 *
 * The game, per pod and per pod-day:
 *   everyone snapped on time   → THRIVE: tree gains HP, its max HP grows, growth +1, ⭐ for everyone
 *   ≥ 70% snapped on time      → STEADY: tree holds
 *   < 70% snapped on time      → WILT:   tree loses HP, more the fewer showed up
 *   HP reaches 0               → the tree dies; the pod can replant
 * Every on-time snap earns its author ⚡ energy and extends their 🔥 streak.
 */

export const RULES = {
  startHp: 100,
  startMaxHp: 100,
  /** Share of members that must snap for the tree to hold steady. */
  steadyThreshold: 0.7,
  /** HP gained on a perfect day (capped at the new max). */
  thriveHp: 15,
  /** Max HP added on a perfect day — the tree "gets higher energy". */
  thriveMaxHp: 5,
  /** HP lost when nobody snaps; scales linearly with the share that missed. */
  wiltMaxLoss: 40,
  energyPerCheckin: 10,
  starsPerPerfectDay: 1,
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
  contributed: boolean
}

export interface MemberUpdate {
  userId: string
  energyDelta: number
  starsDelta: number
  /** Streak after this day. */
  streak: number
}

export interface SettleResult {
  outcome: DayOutcome
  contributors: number
  members: number
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

export function settleDay(tree: TreeState, members: MemberDay[]): SettleResult {
  const contributors = members.filter((m) => m.contributed).length
  const total = members.length

  if (tree.status === 'dead') {
    return {
      outcome: 'dormant',
      contributors,
      members: total,
      hpDelta: 0,
      maxHpDelta: 0,
      growthDelta: 0,
      died: false,
      tree,
      memberUpdates: members.map((m) => ({ userId: m.userId, energyDelta: 0, starsDelta: 0, streak: m.streak })),
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

  const memberUpdates = members.map((m) => ({
    userId: m.userId,
    energyDelta: m.contributed ? RULES.energyPerCheckin : 0,
    starsDelta: m.contributed && outcome === 'thrive' ? RULES.starsPerPerfectDay : 0,
    streak: m.contributed ? m.streak + 1 : 0,
  }))

  return {
    outcome,
    contributors,
    members: total,
    hpDelta: hp - tree.hp,
    maxHpDelta,
    growthDelta,
    died,
    tree: next,
    memberUpdates,
    summary: summarize(outcome, contributors, total, hp - tree.hp, died),
  }
}

function summarize(outcome: DayOutcome, contributors: number, members: number, hpDelta: number, died: boolean) {
  if (died) return `Only ${contributors} of ${members} showed up. The tree ran out of energy and died.`
  if (outcome === 'thrive') return `Everyone showed up! The tree grew${hpDelta > 0 ? ` +${hpDelta} HP` : ''}.`
  if (outcome === 'steady') return `${contributors} of ${members} showed up. The tree held steady.`
  return `Only ${contributors} of ${members} showed up. The tree lost ${-hpDelta} HP.`
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
