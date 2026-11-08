import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { IconButton, PressableScale, Text } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import { useMyMonth, type CalendarDay } from '../hooks'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** On-time days get darker with more pods (GitHub-style); a late-only day is faint; a missed day is empty. */
const FILL = {
  one: 'rgba(123, 214, 75, 0.38)',
  two: 'rgba(123, 214, 75, 0.68)',
  more: colors.leaf.DEFAULT,
  late: 'rgba(123, 214, 75, 0.13)',
  missed: colors.raised,
} as const

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function fillFor(day: CalendarDay | undefined) {
  if (!day) return FILL.missed
  if (day.onTimePods >= 3) return FILL.more
  if (day.onTimePods === 2) return FILL.two
  if (day.onTimePods === 1) return FILL.one
  return day.lateOnly ? FILL.late : FILL.missed
}

function describe(date: string, day: CalendarDay | undefined) {
  const label = new Date(`${date}T12:00:00`).toLocaleDateString([], { month: 'long', day: 'numeric' })
  if (!day) return `${label}: no snap`
  if (day.onTimePods) return `${label}: on time in ${day.onTimePods} ${day.onTimePods === 1 ? 'pod' : 'pods'}`
  return `${label}: snapped late`
}

/**
 * My month at a glance, Monday-first. Only shown on my own profile.
 * Tapping a day with snaps opens them; ‹ › move between months (never past this month).
 */
export function MonthCalendar() {
  const today = new Date()
  const [offset, setOffset] = useState(0) // 0 = this month, -1 = last month…
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const monthStart = iso(first)
  const month = useMyMonth(monthStart)
  const days = month.data ?? {}

  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // blanks before the 1st, Monday-first
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(first.getFullYear(), first.getMonth(), i + 1)))]
  while (cells.length % 7) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  const todayIso = iso(today)
  const shown = Object.keys(days).filter((d) => days[d]!.onTimePods > 0).length

  const move = (delta: number) => {
    haptics.select()
    setOffset(offset + delta)
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: colors.surface, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" label="Previous month" onPress={() => move(-1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          {/* Built by hand: toLocaleDateString on the 1st at midnight can slip to the previous month (e.g. a DST change that day). */}
          <Text style={{ fontSize: 17, fontWeight: '600' }}>
            {MONTHS[first.getMonth()]} {first.getFullYear()}
          </Text>
          <Text variant="caption">{shown === 1 ? '1 day on time' : `${shown} days on time`}</Text>
        </View>
        {offset < 0 ? <IconButton icon="chevronRight" label="Next month" onPress={() => move(1)} /> : <View style={{ width: 40 }} />}
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} variant="caption" center style={{ flex: 1 }}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, w) => (
        <View key={w} style={{ flexDirection: 'row', gap: 6 }}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />
            const future = date > todayIso
            const day = days[date]
            const isToday = date === todayIso
            const square = (
              <View
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 8,
                  backgroundColor: future ? 'transparent' : fillFor(day),
                  borderWidth: isToday ? 2 : future ? 1 : 0,
                  borderColor: isToday ? colors.ink.DEFAULT : colors.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text numeric style={{ fontSize: 11, fontWeight: '600', color: day?.onTimePods && day.onTimePods >= 2 ? colors.ink.inverse : colors.ink.muted }}>
                  {Number(date.slice(8))}
                </Text>
              </View>
            )
            return day && !future ? (
              <PressableScale key={i} flex onPress={() => router.push({ pathname: '/profile/day', params: { date } })} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={describe(date, day)}>
                {square}
              </PressableScale>
            ) : (
              <View key={i} style={{ flex: 1 }} accessible accessibilityLabel={future ? undefined : describe(date, day)}>
                {square}
              </View>
            )
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }} accessible accessibilityLabel="Legend: darker green means on time in more pods; faint means snapped late; empty means no snap">
        <Legend color={FILL.one} label="1" />
        <Legend color={FILL.two} label="2" />
        <Legend color={FILL.more} label="3+ pods" />
        <Legend color={FILL.late} label="late" />
        <Legend color={FILL.missed} label="no snap" />
      </View>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption">{label}</Text>
    </View>
  )
}
