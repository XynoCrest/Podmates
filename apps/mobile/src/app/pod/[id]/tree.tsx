import { healthBand, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, ChunkyButton, HealthBar, IconButton, PressableScale, Text } from '@/components/ui'
import { useAddHabit, useMyHabits, usePodMembers, usePods } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { useEndDay, useTreeHistory, type TreeDay } from '@/features/tree/hooks'
import { isLocal } from '@/lib/env'
import { compact, firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'

const BAND_COLOR = { thriving: colors.leaf.DEFAULT, okay: colors.energy.DEFAULT, struggling: colors.danger.DEFAULT } as const

/**
 * A pod's tree — a game screen: one big illustration, one sentence about how the pod is doing,
 * two numbers, the week, the people keeping it green, one big button.
 */
export default function TreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const pods = usePods()
  const mine = useMyHabits()
  const members = usePodMembers(id)
  const history = useTreeHistory(id)
  const endDay = useEndDay()
  const add = useAddHabit()

  const pod = pods.data?.find((p) => p.id === id)
  if (!pod) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />

  const myHabit = mine.data.find((h) => h.pod.id === id)
  const stage = stageFor(pod.tree.totalSnaps)
  const band = healthBand(pod.tree.health)
  const pct = Math.round(pod.tree.health * 100)

  const cta = !myHabit
    ? { label: `Add ${pod.name} to my habits`, onPress: () => add.mutate(pod.habitId, { onSuccess: () => haptics.success() }), loading: add.isPending }
    : myHabit.today === 'snapped'
      ? { label: "You're done today", disabled: true }
      : myHabit.today === 'rest'
        ? { label: 'Resting today', disabled: true }
        : { label: 'Snap now', onPress: () => router.navigate({ pathname: '/camera', params: { podId: id } }) }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 52 }}>
        <IconButton icon="close" label="Close" onPress={goBack} color={colors.ink.subtle} />
        <Text variant="headline" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: colors.ink.muted }}>
          {pod.name} pod
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24, alignItems: 'stretch' }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TreeArt totalSnaps={pod.tree.totalSnaps} health={pod.tree.health} size={260} />
        </View>

        <Text style={{ fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center', color: colors.ink.DEFAULT, letterSpacing: -0.4 }}>
          {pod.tree.counted ? (
            <>
              <Text style={{ fontSize: 24, lineHeight: 31, fontWeight: '700', color: BAND_COLOR[band] }}>
                {pod.tree.active} of {pod.tree.counted}
              </Text>{' '}
              members are keeping their streak
            </>
          ) : (
            'Nobody to count today. The tree is resting easy'
          )}
        </Text>

        <View style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
          <StatCell label="Stage" value={stage.name} sub={stage.toNext !== null ? `${compact(stage.toNext)} snaps to ${stage.nextName}` : 'Fully grown'} />
          <View style={{ width: 1, backgroundColor: colors.line }} />
          <StatCell label="Health" value={`${pct}%`} sub={`${compact(pod.tree.totalSnaps)} verified snaps`}>
            <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
              <HealthBar ratio={pod.tree.health} height={10} />
            </View>
          </StatCell>
        </View>

        <WeekStrip days={history.data ?? []} />

        {members.data?.length ? (
          <View style={{ gap: 10 }}>
            <Text variant="overline">On a streak</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {members.data
                .filter((m) => m.streak > 0)
                .slice(0, 12)
                .map((m) => (
                  <PressableScale key={m.id} onPress={() => router.push({ pathname: '/user/[id]', params: { id: m.id } })} accessibilityLabel={`${m.display_name}, ${m.streak}-day streak`}>
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Avatar person={m} size={44} />
                      <Text variant="caption">
                        {firstName(m.display_name)} · {m.streak}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
            </View>
          </View>
        ) : null}

        {isLocal && myHabit ? (
          <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.surface }}>
            <Text variant="overline">Demo tools · local only</Text>
            <PressableScale onPress={() => endDay.mutate(undefined, { onSuccess: () => haptics.success() })} accessibilityLabel="End my day now">
              <View style={{ height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink.muted }}>{endDay.isPending ? 'Settling…' : 'End my day now'}</Text>
              </View>
            </PressableScale>
            {endDay.error ? (
              <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
                {endDay.error.message}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <ChunkyButton {...cta} />
      </View>
    </View>
  )
}

function StatCell({ label, value, sub, children }: { label: string; value: string; sub: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 }}>
      <Text variant="overline">{label}</Text>
      <Text numeric style={{ color: colors.leaf.DEFAULT, fontWeight: '700', fontSize: 22, marginTop: 4 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ marginTop: 2 }} center>
        {sub}
      </Text>
      {children}
    </View>
  )
}

/** Last seven days of tree health: green = thriving, yellow = okay, red = struggling. */
function WeekStrip({ days }: { days: TreeDay[] }) {
  if (!days.length) return <Text variant="caption" center>{"The tree's history starts tonight."}</Text>
  return (
    <View style={{ gap: 10 }}>
      <Text variant="overline" center>
        {days.length === 1 ? 'Today so far' : `Last ${days.length} days`}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        {days.map((d) => {
          const color = BAND_COLOR[healthBand(d.health)]
          const weekday = new Date(`${d.day}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' })
          return (
            <View key={d.day} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${d.day}: ${Math.round(d.health * 100)} percent healthy`}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: color }}>
                <Text numeric style={{ fontSize: 11, fontWeight: '700', color }}>
                  {Math.round(d.health * 100)}
                </Text>
              </View>
              <Text variant="caption">{weekday}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
