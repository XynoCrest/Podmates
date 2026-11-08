import { describe, expect, it } from 'vitest'
import { forecast, newTree, outcomeFor, perfectStreak, RULES, settleDay, stageFor, type MemberDay } from './index'

const members = (contributed: boolean[], streak = 2): MemberDay[] =>
  contributed.map((c, i) => ({ userId: `u${i}`, streak, contributed: c }))

describe('outcomeFor', () => {
  it('everyone → thrive, ≥70% → steady, <70% → wilt', () => {
    expect(outcomeFor(4, 4)).toBe('thrive')
    expect(outcomeFor(3, 4)).toBe('steady') // 75%
    expect(outcomeFor(7, 10)).toBe('steady') // exactly 70%
    expect(outcomeFor(2, 3)).toBe('wilt') // 66%
    expect(outcomeFor(0, 4)).toBe('wilt')
  })

  it('an empty pod holds steady', () => {
    expect(outcomeFor(0, 0)).toBe('steady')
  })
})

describe('best streak', () => {
  it('grows with the streak and never goes down after a miss', () => {
    const tree = { hp: 100, maxHp: 100, growth: 0, status: 'alive' as const }
    const up = settleDay(tree, [{ userId: 'a', streak: 9, bestStreak: 9, contributed: true }]).memberUpdates[0]!
    expect(up).toMatchObject({ streak: 10, bestStreak: 10 })
    const miss = settleDay(tree, [{ userId: 'a', streak: 10, bestStreak: 10, contributed: false }]).memberUpdates[0]!
    expect(miss).toMatchObject({ streak: 0, bestStreak: 10 })
    const back = settleDay(tree, [{ userId: 'a', streak: 0, bestStreak: 10, contributed: true }]).memberUpdates[0]!
    expect(back).toMatchObject({ streak: 1, bestStreak: 10 })
  })

  it('defaults to the current streak when no best is known', () => {
    const tree = { hp: 100, maxHp: 100, growth: 0, status: 'alive' as const }
    expect(settleDay(tree, [{ userId: 'a', streak: 4, contributed: false }]).memberUpdates[0]!.bestStreak).toBe(4)
  })

  it('a resting (dead) tree keeps the best streak', () => {
    const r = settleDay({ hp: 0, maxHp: 100, growth: 0, status: 'dead' }, [{ userId: 'a', streak: 3, bestStreak: 7, contributed: true }])
    expect(r.memberUpdates[0]!.bestStreak).toBe(7)
  })
})

describe('settleDay', () => {
  it('a perfect day grows HP, max HP and growth, and extends streaks', () => {
    const r = settleDay({ hp: 90, maxHp: 100, growth: 3, status: 'alive' }, members([true, true, true]))
    expect(r.outcome).toBe('thrive')
    expect(r.tree).toEqual({ hp: 105, maxHp: 105, growth: 4, status: 'alive' })
    expect(r.memberUpdates.every((m) => m.streak === 3)).toBe(true)
  })

  it('caps HP at the new max', () => {
    const r = settleDay({ hp: 100, maxHp: 100, growth: 0, status: 'alive' }, members([true, true]))
    expect(r.tree.hp).toBe(105)
    expect(r.hpDelta).toBe(5)
  })

  it('a steady day keeps HP, extends contributor streaks and resets missers', () => {
    const r = settleDay(newTree(), members([true, true, true, false]))
    expect(r.outcome).toBe('steady')
    expect(r.tree.hp).toBe(100)
    expect(r.memberUpdates.map((m) => m.streak)).toEqual([3, 3, 3, 0])
  })

  it('wilt loss scales with the share that missed', () => {
    expect(settleDay(newTree(), members([true, false])).hpDelta).toBe(-20)
    expect(settleDay(newTree(), members([false, false, false])).hpDelta).toBe(-40)
  })

  it('the tree dies at 0 HP and stays dormant afterwards', () => {
    const dying = settleDay({ hp: 30, maxHp: 100, growth: 1, status: 'alive' }, members([false, false]))
    expect(dying.died).toBe(true)
    expect(dying.tree).toMatchObject({ hp: 0, status: 'dead' })
    const after = settleDay(dying.tree, members([true, true]))
    expect(after.outcome).toBe('dormant')
    expect(after.tree).toEqual(dying.tree)
  })
})

describe('forecast', () => {
  it('reports the snaps still needed for each outcome', () => {
    const f = forecast(newTree(), 1, 4)
    expect(f.outcome).toBe('wilt')
    expect(f.toSteady).toBe(2) // ceil(4 × 0.7) = 3
    expect(f.toThrive).toBe(3)
  })
})

describe('stageFor', () => {
  it('walks the stages by perfect days', () => {
    expect(stageFor(0)).toMatchObject({ level: 1, name: 'Seed', toNext: 2 })
    expect(stageFor(6)).toMatchObject({ level: 3, name: 'Sapling', toNext: 4 })
    expect(stageFor(99)).toMatchObject({ level: 6, toNext: null })
  })
})

describe('perfectStreak', () => {
  it('counts consecutive perfect days and resets on anything else', () => {
    expect(perfectStreak(3, 'thrive')).toBe(4)
    expect(perfectStreak(3, 'steady')).toBe(0)
    expect(perfectStreak(3, 'wilt')).toBe(0)
    expect(perfectStreak(3, 'dormant')).toBe(0)
  })

  it('a pair of two only thrives when both snap', () => {
    expect(outcomeFor(2, 2)).toBe('thrive')
    expect(outcomeFor(1, 2)).toBe('wilt')
  })
})
