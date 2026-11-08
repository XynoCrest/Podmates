import { formatSnapTime } from '@podmates/shared'
import { forecast, healthRatio, RULES, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, HealthBar, Icon, IconButton, Meta, Text, Tile, type IconName } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { podWindow, usePod, usePodMembers, type Member } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { useEndDay, useOpenWindow, useReplant, useTreeHistory, type PodDay } from '@/features/tree/hooks'
import { isLocal } from '@/lib/env'
import { firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'
import { useNow } from '@/lib/useNow'

/**
 * The pod's garden plot: the tree, who has tended it today, what tonight will do
 * to it, and one button for the thing you can do about it.
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
  const ratio = dead ? 0 : healthRatio(tree)

  const cta = dead
    ? { label: 'Replant the tree', variant: 'primary' as const, onPress: () => replant.mutate(undefined, { onSuccess: () => haptics.success() }), loading: replant.isPending }
    : pod.meContributedToday
      ? { label: 'You snapped today', variant: 'primary' as const, disabled: true }
      : w.status === 'open'
        ? { label: `Snap now · +${RULES.energyPerCheckin} energy`, variant: 'sun' as const, icon: 'cameraFill' as const, onPress: () => router.navigate({ pathname: '/camera', params: { podId: id } }) }
        : w.status === 'upcoming'
          ? { label: `Window opens at ${formatSnapTime(pod.snapTime)}`, variant: 'primary' as const, disabled: true }
          : { label: "Today's window has closed", variant: 'primary' as const, disabled: true }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56, gap: 4 }}>
        <IconButton icon="back" label="Back" onPress={goBack} />
        <View style={{ flex: 1 }}>
          <Text variant="headline" numberOfLines={1}>
            {pod.name}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {pod.goal}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 12 }}>
          <Meta icon="bolt" label={`${myStats?.energy ?? 0}`} color={colors.ink.muted} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 24 }}>
        {/* The plot: the one rich thing on this screen. */}
        <Tile style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 16 }}>
          <TreeArt growth={pod.growth} health={ratio} dead={dead} size={232} />
          <Gardeners members={members.data ?? []} />
        </Tile>

        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '600', color: colors.ink.DEFAULT, paddingHorizontal: 4 }}>
          {dead ? (
            <>
              The tree <Hl color={colors.danger.DEFAULT}>ran out of energy</Hl>. Plant a new one together
            </>
          ) : w.status === 'closed' && f.outcome !== 'thrive' ? (
            <>
              {pod.contributedToday} of {pod.memberCount} snapped.{' '}
              {f.outcome === 'steady' ? 'The tree holds steady tonight' : <Hl color={colors.danger.DEFAULT}>It loses {-f.hpDelta} HP tonight</Hl>}
            </>
          ) : f.outcome === 'thrive' ? (
            <>
              Everyone snapped. Tonight the tree <Hl color={colors.leaf.DEFAULT}>grows {f.hpDelta} HP</Hl>
            </>
          ) : f.outcome === 'steady' ? (
            <>
              <Hl color={colors.leaf.DEFAULT}>
                {f.toThrive} more {f.toThrive === 1 ? 'snap' : 'snaps'}
              </Hl>{' '}
              and the tree grows tonight
            </>
          ) : (
            <>
              <Hl color={colors.sun.DEFAULT}>
                {f.toSteady} more {f.toSteady === 1 ? 'snap' : 'snaps'}
              </Hl>{' '}
              or the tree loses {-f.hpDelta} HP tonight
            </>
          )}
        </Text>

        <Tile style={{ paddingHorizontal: 16 }}>
          <Row icon="tree" label="Stage" value={stage.name} sub={stage.toNext === null ? `Level ${stage.level}, fully grown` : `Level ${stage.level} · ${stage.toNext} perfect days to the next`} />
          <Row icon="leaf" label="Health" value={`${dead ? 0 : pod.hp} / ${pod.maxHp} HP`} divider>
            <View style={{ marginTop: 8 }}>
              <HealthBar ratio={ratio} />
            </View>
          </Row>
          <Row icon="flame" label="Your streak" value={`${myStats?.streak ?? 0} days`} divider />
        </Tile>

        <WeekStrip days={history.data ?? []} />

        {isLocal ? (
          <View style={{ gap: 8 }}>
            <Text variant="label">Demo tools, local only</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button variant="secondary" size="sm" flex label={openWindow.isPending ? 'Opening' : 'Open window now'} onPress={() => openWindow.mutate()} />
              <Button variant="secondary" size="sm" flex label={endDay.isPending ? 'Settling' : 'End the day now'} onPress={() => endDay.mutate(undefined, { onSuccess: () => haptics.success() })} />
            </View>
            {openWindow.error || endDay.error || replant.error ? (
              <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
                {(openWindow.error ?? endDay.error ?? replant.error)!.message}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button size="lg" {...cta} />
      </View>
    </View>
  )
}

/** Who has tended the plot today: full colour with a check, or faded and waiting. */
function Gardeners({ members }: { members: Member[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
      {members.map((m) => (
        <View key={m.id} style={{ alignItems: 'center', gap: 4, opacity: m.contributedToday ? 1 : 0.5 }}>
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
                borderColor: colors.surface,
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

function Hl({ children, color }: { children: ReactNode; color: string }) {
  return <Text style={{ color, fontSize: 22, lineHeight: 28, fontWeight: '600' }}>{children}</Text>
}

function Row({ icon, label, value, sub, divider, children }: { icon: IconName; label: string; value: string; sub?: string; divider?: boolean; children?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 16, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={icon} size={18} color={colors.ink.subtle} />
        <Text variant="subhead" style={{ flex: 1 }}>
          {label}
        </Text>
        <Text numeric style={{ fontSize: 16, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
      {sub ? (
        <Text variant="caption" style={{ marginTop: 4, marginLeft: 30 }}>
          {sub}
        </Text>
      ) : null}
      {children ? <View style={{ marginLeft: 30 }}>{children}</View> : null}
    </View>
  )
}

const OUTCOME: Record<PodDay['outcome'], { bg: string; fg: string; icon: IconName; word: string }> = {
  thrive: { bg: colors.leaf.soft, fg: colors.leaf.DEFAULT, icon: 'leaf', word: 'grew' },
  steady: { bg: colors.raised, fg: colors.ink.muted, icon: 'check', word: 'held' },
  wilt: { bg: colors.danger.soft, fg: colors.danger.DEFAULT, icon: 'arrowDown', word: 'wilted' },
  dormant: { bg: colors.raised, fg: colors.ink.subtle, icon: 'moon', word: 'resting' },
}

/** The last seven settled days as a row of plot markers. */
function WeekStrip({ days }: { days: PodDay[] }) {
  if (!days.length) return <Text variant="subhead">The first day ends tonight</Text>
  return (
    <View style={{ gap: 12 }}>
      <Text variant="label">Last {days.length} days</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((d) => {
          const s = OUTCOME[d.outcome]
          const weekday = new Date(`${d.podDate}T12:00:00`).toLocaleDateString([], { weekday: 'short' })
          return (
            <View key={d.podDate} style={{ alignItems: 'center', gap: 8 }} accessibilityLabel={`${weekday}: the tree ${s.word}, ${d.contributors} of ${d.members} snapped`}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} color={s.fg} weight="semibold" />
              </View>
              <Text variant="caption">{weekday}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
