import { describe, expect, it } from 'vitest'
import { formatSnapTime, podDate, snapTimeIn, windowState, zoneOffsetMinutes } from './snapWindow'

// 2026-11-07 02:05 UTC = 2026-11-06 21:05 in Toronto (EST, UTC-5)
const now = new Date('2026-11-07T02:05:00Z')
const pod = { snapTime: '21:00:00', windowMinutes: 20, timeZone: 'America/Toronto' }

describe('windowState', () => {
  it('is open inside [snap_time, snap_time + window)', () => {
    expect(windowState(now, pod)).toEqual({ status: 'open', closesInMin: 15 })
  })
  it('is upcoming before and closed after', () => {
    expect(windowState(now, { ...pod, snapTime: '21:30' })).toEqual({ status: 'upcoming', opensInMin: 25 })
    expect(windowState(now, { ...pod, snapTime: '20:45' })).toEqual({ status: 'closed' })
  })
})

describe('pod dates and offsets', () => {
  it('uses the pod-local calendar date', () => {
    expect(podDate(now, 'America/Toronto')).toBe('2026-11-06')
    expect(podDate(now, 'UTC')).toBe('2026-11-07')
  })
  it('computes zone offsets', () => {
    expect(zoneOffsetMinutes(now, 'America/Toronto')).toBe(-300)
    expect(zoneOffsetMinutes(now, 'Asia/Kolkata')).toBe(330)
  })
  it('converts a pod snap time into the device zone', () => {
    expect(snapTimeIn(pod, 'America/Vancouver', now)).toEqual({ hour: 18, minute: 0 })
    expect(snapTimeIn(pod, 'Europe/London', now)).toEqual({ hour: 2, minute: 0 })
  })
})

it('formats snap times', () => {
  expect(formatSnapTime('21:00:00')).toBe('9:00 PM')
  expect(formatSnapTime('06:30')).toBe('6:30 AM')
  expect(formatSnapTime('00:05')).toBe('12:05 AM')
})
