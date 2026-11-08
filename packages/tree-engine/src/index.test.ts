import { describe, expect, it } from 'vitest'
import { addDays, healthBand, liveStreak, restDaysLeft, RULES, settleStreak, stageFor, treeHealth, weekStart, type DayStatus } from './index'

const history = (start: string, codes: string): Record<string, DayStatus> => {
  const out: Record<string, DayStatus> = {}
  ;[...codes].forEach((c, i) => {
    if (c === '1') out[addDays(start, i)] = 'snapped'
    if (c === 'r') out[addDays(start, i)] = 'rest'
  })
  return out
}

describe('dates', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-09')).toBe('2026-11-09') // Monday
    expect(weekStart('2026-11-12')).toBe('2026-11-09') // Thursday
    expect(weekStart('2026-11-15')).toBe('2026-11-09') // Sunday
  })
})

describe('settleStreak', () => {
  const from = '2026-11-01'

  it('counts consecutive snapped days', () => {
    expect(settleStreak(history(from, '1111'), from, '2026-11-04')).toEqual({ current: 4, best: 4 })
  })

  it('a rest day holds the streak without adding to it', () => {
    expect(settleStreak(history(from, '11r11'), from, '2026-11-05')).toEqual({ current: 4, best: 4 })
  })

  it('a missed day resets to 0 but keeps the best', () => {
    expect(settleStreak(history(from, '111011'), from, '2026-11-06')).toEqual({ current: 2, best: 3 })
  })

  it('a day with no entry is a miss', () => {
    expect(settleStreak(history(from, '111'), from, '2026-11-05')).toEqual({ current: 0, best: 3 })
  })

  it('resting from the start keeps the streak at 0', () => {
    expect(settleStreak(history(from, 'rr1'), from, '2026-11-03')).toEqual({ current: 1, best: 1 })
  })

  it('an empty range is no streak', () => {
    expect(settleStreak({}, '2026-11-05', '2026-11-04')).toEqual({ current: 0, best: 0 })
  })

  it('removing a day (rejected snap) recalculates from history', () => {
    const days = history(from, '11111')
    delete days['2026-11-03']
    expect(settleStreak(days, from, '2026-11-05')).toEqual({ current: 2, best: 2 })
  })
})

describe('liveStreak', () => {
  it('adds today only once it is snapped', () => {
    expect(liveStreak(5, 'snapped')).toBe(6)
    expect(liveStreak(5, 'rest')).toBe(5)
    expect(liveStreak(5, null)).toBe(5)
  })
})

describe('restDaysLeft', () => {
  it('allows two per week, never negative', () => {
    expect(RULES.restDaysPerWeek).toBe(2)
    expect(restDaysLeft(0)).toBe(2)
    expect(restDaysLeft(1)).toBe(1)
    expect(restDaysLeft(2)).toBe(0)
    expect(restDaysLeft(5)).toBe(0)
  })
})

describe('treeHealth', () => {
  it('is the share of counted members on an active streak', () => {
    const r = treeHealth([
      { settledStreak: 3, today: null }, // alive, day not over
      { settledStreak: 0, today: 'snapped' }, // back today
      { settledStreak: 0, today: null }, // not on a streak
      { settledStreak: 9, today: 'snapped' },
    ])
    expect(r).toEqual({ health: 0.75, active: 3, counted: 4 })
  })

  it('leaves resting members out of both numbers', () => {
    const r = treeHealth([
      { settledStreak: 4, today: 'rest' },
      { settledStreak: 2, today: null },
      { settledStreak: 0, today: null },
    ])
    expect(r).toEqual({ health: 0.5, active: 1, counted: 2 })
  })

  it('a pod with nobody counted is fully healthy', () => {
    expect(treeHealth([])).toEqual({ health: 1, active: 0, counted: 0 })
    expect(treeHealth([{ settledStreak: 1, today: 'rest' }]).health).toBe(1)
  })
})

describe('stageFor', () => {
  it('grows with lifetime verified snaps', () => {
    expect(stageFor(0)).toMatchObject({ level: 1, name: 'Seed', nextName: 'Sprout', toNext: 25 })
    expect(stageFor(24).name).toBe('Seed')
    expect(stageFor(25).name).toBe('Sprout')
    expect(stageFor(477)).toMatchObject({ level: 4, name: 'Young tree', toNext: 523 })
    expect(stageFor(5000)).toMatchObject({ level: 6, name: 'Ancient tree', nextName: null, toNext: null })
  })
})

describe('healthBand', () => {
  it('labels health for the UI', () => {
    expect(healthBand(1)).toBe('thriving')
    expect(healthBand(0.75)).toBe('thriving')
    expect(healthBand(0.5)).toBe('okay')
    expect(healthBand(0.39)).toBe('struggling')
  })
})
