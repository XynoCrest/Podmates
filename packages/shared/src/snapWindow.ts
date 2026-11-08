/**
 * Snap-window maths for DISPLAY and notification scheduling.
 *
 * The authority is the database: the `snaps_before_insert` trigger stamps
 * `pod_date` and `on_time` from the server clock. This file must apply the same
 * rule — local time in the pod's timezone t is on time when
 *   snap_time ≤ t < snap_time + window_minutes
 * — so the countdown the user sees matches what the server will record.
 * Windows never cross midnight (a DB check constraint guarantees it).
 */

export interface PodSchedule {
  /** 'HH:MM' or 'HH:MM:SS', in the pod's timezone. */
  snapTime: string
  windowMinutes: number
  timeZone: string
}

export type WindowState =
  | { status: 'upcoming'; opensInMin: number }
  | { status: 'open'; closesInMin: number }
  | { status: 'closed' }

/** Wall-clock date and minute-of-day in `timeZone` at instant `now`. */
export function zonedParts(now: Date, timeZone: string): { date: string; minuteOfDay: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minuteOfDay: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

/** The pod-day an instant belongs to (the pod's local calendar date). */
export const podDate = (now: Date, timeZone: string) => zonedParts(now, timeZone).date

export function parseSnapTime(snapTime: string): number {
  const [h, m] = snapTime.split(':').map(Number)
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) throw new Error(`Bad snap time: ${snapTime}`)
  return h * 60 + m
}

export function windowState(now: Date, schedule: PodSchedule): WindowState {
  const { minuteOfDay } = zonedParts(now, schedule.timeZone)
  const start = parseSnapTime(schedule.snapTime)
  const end = start + schedule.windowMinutes
  if (minuteOfDay < start) return { status: 'upcoming', opensInMin: start - minuteOfDay }
  if (minuteOfDay < end) return { status: 'open', closesInMin: end - minuteOfDay }
  return { status: 'closed' }
}

/** UTC offset of `timeZone` at `now`, in minutes (Toronto in winter → -300). */
export function zoneOffsetMinutes(now: Date, timeZone: string): number {
  const { date, minuteOfDay } = zonedParts(now, timeZone)
  const asUtc = Date.parse(`${date}T00:00:00Z`) + minuteOfDay * 60_000
  return Math.round((asUtc - Math.floor(now.getTime() / 60_000) * 60_000) / 60_000)
}

/**
 * The pod's snap time expressed in another timezone (the device's), for a daily
 * local notification. Uses today's offsets, so it is rescheduled on app start.
 */
export function snapTimeIn(schedule: PodSchedule, deviceTimeZone: string, now = new Date()) {
  const podMinutes = parseSnapTime(schedule.snapTime)
  const shift = zoneOffsetMinutes(now, deviceTimeZone) - zoneOffsetMinutes(now, schedule.timeZone)
  const minutes = (((podMinutes + shift) % 1440) + 1440) % 1440
  return { hour: Math.floor(minutes / 60), minute: minutes % 60 }
}

/** "9:00 PM" style label for a pod's snap time. */
export function formatSnapTime(snapTime: string): string {
  const total = parseSnapTime(snapTime)
  const h = Math.floor(total / 60)
  const m = total % 60
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}
