import { describe, expect, it } from 'vitest'
import { addDays, daysToSettle, endOfLocalDay } from './dates'

describe('dates', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('lists the days still to settle', () => {
    expect(daysToSettle('2026-11-04', '2026-11-06')).toEqual(['2026-11-05', '2026-11-06'])
    expect(daysToSettle('2026-11-06', '2026-11-06')).toEqual([])
  })
  it('finds local midnight', () => {
    expect(endOfLocalDay('2026-11-06', 'America/Toronto').toISOString()).toBe('2026-11-07T05:00:00.000Z')
  })
})
