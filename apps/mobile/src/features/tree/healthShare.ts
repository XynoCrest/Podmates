/**
 * Pod health as 100 points split across members. Fair share is 100 / n.
 * Anyone keeping pace with the group's best streak fills theirs; someone
 * falling behind (shorter streak, missed today) fills less, which is how
 * one person holding the group back reads as 33 · 33 · 25.
 */
export interface HealthMember {
  id: string
  streak: number
  contributedToday: boolean
}

export interface HealthShare extends HealthMember {
  /** Points this person is actually putting in, 0–fair. */
  share: number
  /** What they would put in if they were keeping up. */
  fair: number
  dragging: boolean
}

export function shareHealth(members: HealthMember[]): HealthShare[] {
  const n = members.length
  if (n === 0) return []
  const fair = Math.floor(100 / n)
  let leftover = 100 - fair * n
  const best = Math.max(1, ...members.map((m) => m.streak))
  const someoneIn = members.some((m) => m.contributedToday)

  const rows: HealthShare[] = members.map((m) => {
    const pace = m.streak / best
    // Soft floor so a zero-streak member still shows a sliver, not a hole.
    const fromStreak = 0.4 + 0.6 * pace
    const miss = someoneIn && !m.contributedToday ? 0.85 : 1
    const factor = Math.min(1, fromStreak * miss)
    const share = Math.round(fair * factor)
    return { ...m, share, fair, dragging: share < fair }
  })

  for (const row of rows) {
    if (leftover <= 0) break
    if (!row.dragging) {
      row.share += 1
      row.fair += 1
      leftover -= 1
    }
  }
  return rows
}

export const healthTotal = (shares: HealthShare[]) => shares.reduce((n, s) => n + s.share, 0)
