import { formatSnapTime, snapTimeIn } from '@podmates/shared'
import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, StreakCount, Text } from '@/components/ui'
import { deviceTimeZone } from '@/lib/format'
import { podWindow, type PodSummary } from '../hooks'

/** "6:30 PM" on this device's clock for a pod's snap time. */
function localSnapTime(pod: PodSummary) {
  const { hour, minute } = snapTimeIn({ snapTime: pod.snapTime, windowMinutes: pod.windowMinutes, timeZone: pod.timeZone }, deviceTimeZone())
  return formatSnapTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
}

/**
 * Today's reminder for the selected habit: done, the window open now (snap), opening later, or closed.
 * Looks across the habit's pods and speaks about the one that matters most right now.
 */
export function TodayCard({ habitName, pods, now }: { habitName: string; pods: PodSummary[]; now: Date }) {
  const alive = pods.filter((p) => p.treeStatus === 'alive')
  const pending = alive.filter((p) => !p.meContributedToday)
  const open = pending.find((p) => podWindow(p, now).status === 'open')
  const upcoming = pending.find((p) => podWindow(p, now).status === 'upcoming')
  const pod = open ?? upcoming ?? pending[0] ?? alive[0] ?? pods[0]
  if (!pod) return null

  const streak = Math.max(0, ...pods.map((p) => p.myStreak))
  const w = podWindow(pod, now)
  const status = !alive.length
    ? { text: 'Your tree needs replanting before you can snap.', color: colors.danger.DEFAULT }
    : !pending.length
      ? { text: 'Snapped today. Your streak is safe.', color: colors.leaf.DEFAULT }
      : w.status === 'open'
        ? { text: streak > 0 ? `Snap today to make it ${streak + 1} days.` : 'Snap today to start a streak.', color: colors.ink.DEFAULT }
        : w.status === 'upcoming'
          ? { text: `Your window opens at ${localSnapTime(pod)}. Snap then to keep your streak.`, color: colors.ink.DEFAULT }
          : { text: "Today's window has closed. Snap tomorrow to start again.", color: colors.ink.muted }

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>
            {habitName}
          </Text>
          <StreakCount count={streak} size={18} />
        </View>
        <Text style={{ fontSize: 15, lineHeight: 20, color: status.color }}>{status.text}</Text>
        {open ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button label="Snap now" icon="camera" onPress={() => router.navigate({ pathname: '/camera', params: { podId: open.id } })} />
            </View>
            {w.status === 'open' ? (
              <Text variant="caption" numeric style={{ color: colors.flame.DEFAULT, fontWeight: '600' }}>
                {w.closesInMin} min left
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  )
}
