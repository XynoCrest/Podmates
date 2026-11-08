/** Compact relative age: "now", "5m", "4h", "3d", "2w". */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return `${Math.floor(d / 7)}w`
}

/** 8.5K / 1.2M style counts. */
export function compact(n: number): string {
  const abs = Math.abs(n)
  if (abs < 1000) return String(n)
  if (abs < 1_000_000) return `${trim(n / 1000)}K`
  return `${trim(n / 1_000_000)}M`
}

const trim = (n: number) => (Math.abs(n) >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, ''))

/** "9:41 PM" for chat timestamps today, "Tue" this week, else "Nov 3". */
export function chatTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const days = (now.getTime() - d.getTime()) / 86_400_000
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days < 6) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const firstName = (displayName: string) => displayName.split(' ')[0] ?? displayName

export const initials = (displayName: string) =>
  displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
