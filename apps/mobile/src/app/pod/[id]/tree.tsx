import { formatSnapTime } from '@podmates/shared'
import { forecast, healthRatio, RULES, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { goBack } from '@/lib/nav'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, ChunkyButton, HealthBar, Icon, IconButton, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { podWindow, usePod, usePodMembers } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { useEndDay, useOpenWindow, useReplant, useTreeHistory, type PodDay } from '@/features/tree/hooks'
import { isLocal } from '@/lib/env'
import { firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/**
 * The pod's tree — a game screen: one big illustration, one sentence saying
 * what today means for it, two numbers, one big button.
 */
export default function TreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow(15_000)
  const { data: pod } = usePod(id)
  const members = usePodMembers(pod)
  const history = useTreeHistory(id)
  const replant = useReplant(id)
  const endDay = useEndDay(id)
  const openWindow = useOpenWindow(id)

  if (!pod) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />

  const dead = pod.treeStatus === 'dead'
  const tree = { hp: pod.hp, maxHp: pod.maxHp, growth: pod.growth, status: pod.treeStatus }
  const stage = stageFor(pod.growth)
  const f = forecast(tree, pod.contributedToday, pod.memberCount)
  const w = podWindow(pod, now)
  const myStats = members.data?.find((m) => m.id === me)
  const ratio = healthRatio(tree)

  const cta = dead
    ? { label: 'Replant 🌱', onPress: () => replant.mutate(undefined, { onSuccess: () => haptics.success() }), loading: replant.isPending }
    : pod.meContributedToday
      ? { label: "You're done today", disabled: true }
      : w.status === 'open'
        ? { label: `Snap now  +${RULES.energyPerCheckin} ⚡`, onPress: () => router.navigate({ pathname: '/camera', params: { podId: id } }), color: colors.flame.DEFAULT, lip: colors.flame.deep }
        : w.status === 'upcoming'
          ? { label: `Opens at ${formatSnapTime(pod.snapTime)}`, disabled: true }
          : { label: 'Window closed for today', disabled: true }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 52 }}>
        <IconButton icon="close" label="Close" onPress={goBack} color={colors.ink.subtle} />
        <Text variant="headline" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: colors.ink.subtle, fontWeight: '800' }}>
          {pod.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minWidth: 40, justifyContent: 'flex-end' }}>
          <Icon name="bolt" size={20} color={colors.energy.DEFAULT} />
          <Text numeric style={{ color: colors.energy.DEFAULT, fontWeight: '800', fontSize: 17 }}>
            {myStats?.energy ?? 0}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 22, alignItems: 'stretch' }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TreeArt growth={pod.growth} health={ratio} dead={dead} size={260} />
          <MemberRing members={members.data ?? []} />
        </View>

        <Headline>
          {dead ? (
            <>
              The tree <Hl color={colors.danger.DEFAULT}>ran out of energy</Hl>. Plant a new seed together.
            </>
          ) : f.outcome === 'thrive' ? (
            <>
              Everyone snapped! Tonight the tree will <Hl color={colors.leaf.DEFAULT}>grow +{f.hpDelta} HP</Hl>.
            </>
          ) : w.status === 'closed' ? (
            // Nobody can snap any more today: state the outcome instead of asking for snaps.
            <>
              {pod.contributedToday} of {pod.memberCount} snapped.{' '}
              {f.outcome === 'steady' ? (
                <Hl color={colors.leaf.DEFAULT}>The tree holds steady tonight.</Hl>
              ) : (
                <Hl color={colors.flame.DEFAULT}>The tree loses {-f.hpDelta} HP tonight.</Hl>
              )}
            </>
          ) : f.outcome === 'steady' ? (
            <>
              <Hl color={colors.leaf.DEFAULT}>{f.toThrive} more {f.toThrive === 1 ? 'snap' : 'snaps'}</Hl> and the tree grows tonight.
            </>
          ) : (
            <>
              <Hl color={colors.flame.DEFAULT}>
                {f.toSteady} more {f.toSteady === 1 ? 'snap' : 'snaps'}
              </Hl>{' '}
              or the tree loses {-f.hpDelta} HP tonight.
            </>
          )}
        </Headline>

        <View style={{ flexDirection: 'row', borderRadius: 18, borderWidth: 2, borderColor: colors.line }}>
          <StatCell label="Stage" value={stage.name} sub={`Level ${stage.level} of ${stage.levels}`} />
          <View style={{ width: 2, backgroundColor: colors.line }} />
          <StatCell label="Health" value={`${dead ? 0 : pod.hp}/${pod.maxHp}`} sub={`${pod.contributedToday} of ${pod.memberCount} snapped today`}>
            <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
              <HealthBar ratio={dead ? 0 : ratio} height={10} />
            </View>
          </StatCell>
        </View>

        <WeekStrip days={history.data ?? []} />

        {isLocal ? (
          <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.surface }}>
            <Text variant="overline">Demo tools · local only</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DevButton label={openWindow.isPending ? 'Opening…' : 'Open window now'} onPress={() => openWindow.mutate()} />
              <DevButton label={endDay.isPending ? 'Settling…' : 'End the day now'} onPress={() => endDay.mutate(undefined, { onSuccess: () => haptics.success() })} />
            </View>
            {openWindow.error || endDay.error || replant.error ? (
              <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
                {(openWindow.error ?? endDay.error ?? replant.error)!.message}
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

function MemberRing({ members }: { members: { id: string; display_name: string; avatar_color: string; avatar_url: string | null; contributedToday: boolean }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 4 }}>
      {members.map((m) => (
        <View key={m.id} style={{ alignItems: 'center', gap: 4, opacity: m.contributedToday ? 1 : 0.55 }}>
          <View>
            <Avatar person={m} size={40} />
            <View
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.canvas,
                backgroundColor: m.contributedToday ? colors.leaf.DEFAULT : colors.raised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.contributedToday ? 'check' : 'clock'} size={10} color={m.contributedToday ? colors.ink.inverse : colors.ink.subtle} weight="bold" />
            </View>
          </View>
          <Text variant="caption">{firstName(m.display_name)}</Text>
        </View>
      ))}
    </View>
  )
}

function Headline({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 26, lineHeight: 33, fontWeight: '800', textAlign: 'center', color: colors.ink.DEFAULT, letterSpacing: -0.4 }}>{children}</Text>
}

function Hl({ children, color }: { children: ReactNode; color: string }) {
  return <Text style={{ color, fontSize: 26, lineHeight: 33, fontWeight: '800' }}>{children}</Text>
}

function StatCell({ label, value, sub, children }: { label: string; value: string; sub: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 }}>
      <Text style={{ color: colors.ink.subtle, fontWeight: '800', fontSize: 14, letterSpacing: 1.2 }}>{label.toUpperCase()}</Text>
      <Text numeric style={{ color: colors.leaf.DEFAULT, fontWeight: '800', fontSize: 24, marginTop: 4 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ marginTop: 2 }}>
        {sub}
      </Text>
      {children}
    </View>
  )
}

const OUTCOME_STYLE: Record<PodDay['outcome'], { bg: string; fg: string; icon: 'leaf' | 'check' | 'arrowDown' | 'moon' }> = {
  thrive: { bg: colors.leaf.DEFAULT, fg: colors.ink.inverse, icon: 'leaf' },
  steady: { bg: colors.raised, fg: colors.ink.muted, icon: 'check' },
  wilt: { bg: colors.danger.soft, fg: colors.danger.DEFAULT, icon: 'arrowDown' },
  dormant: { bg: colors.surface, fg: colors.ink.subtle, icon: 'moon' },
}

/** Last seven settled days: green = grew, grey = held, red = wilted. */
function WeekStrip({ days }: { days: PodDay[] }) {
  if (!days.length) return <Text variant="caption" center>{"The tree's first day ends tonight."}</Text>
  return (
    <View style={{ gap: 10 }}>
      <Text variant="overline" center>
        Last {days.length} days
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        {days.map((d) => {
          const s = OUTCOME_STYLE[d.outcome]
          const weekday = new Date(`${d.podDate}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' })
          return (
            <View key={d.podDate} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${d.podDate}: ${d.outcome}, ${d.contributors} of ${d.members}`}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={15} color={s.fg} weight="bold" />
              </View>
              <Text variant="caption">{weekday}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} flex accessibilityLabel={label}>
      <View style={{ height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink.muted }}>{label}</Text>
      </View>
    </PressableScale>
  )
}
