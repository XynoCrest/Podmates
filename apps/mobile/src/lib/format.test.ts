import { describe, expect, it } from 'vitest'
import { compact, initials, timeAgo } from './format'

describe('format', () => {
  const now = Date.parse('2026-11-07T12:00:00Z')
  it('timeAgo', () => {
    expect(timeAgo('2026-11-07T11:59:30Z', now)).toBe('now')
    expect(timeAgo('2026-11-07T11:55:00Z', now)).toBe('5m')
    expect(timeAgo('2026-11-07T07:00:00Z', now)).toBe('5h')
    expect(timeAgo('2026-11-04T12:00:00Z', now)).toBe('3d')
    expect(timeAgo('2026-10-20T12:00:00Z', now)).toBe('2w')
  })
  it('compact', () => {
    expect(compact(950)).toBe('950')
    expect(compact(8500)).toBe('8.5K')
    expect(compact(2087)).toBe('2.1K')
    expect(compact(125_000)).toBe('125K')
    expect(compact(1_200_000)).toBe('1.2M')
  })
  it('initials', () => {
    expect(initials('Ben S.')).toBe('BS')
    expect(initials('Maya')).toBe('M')
  })
})
