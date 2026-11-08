/** Calendar-date helpers on 'YYYY-MM-DD' strings (no timezones involved). */

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Every date after `lastSettled` up to and including `through`. */
export function daysToSettle(lastSettled: string, through: string): string[] {
  const out: string[] = []
  for (let d = addDays(lastSettled, 1); d <= through; d = addDays(d, 1)) out.push(d)
  return out
}

/** The instant a pod-local date ends (next local midnight), for stamping the summary message. */
export function endOfLocalDay(date: string, timeZone: string): Date {
  const next = addDays(date, 1)
  // Guess UTC midnight, then correct by the zone's offset at that moment.
  const guess = new Date(`${next}T00:00:00Z`)
  const local = new Date(guess.toLocaleString('en-US', { timeZone }))
  const utc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(guess.getTime() - (local.getTime() - utc.getTime()))
}
