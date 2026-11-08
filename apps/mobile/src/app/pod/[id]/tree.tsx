import { formatSnapTime } from '@podmates/shared'
import { forecast, healthRatio, RULES, STAGES, stageFor, type DayOutcome } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, ChunkyButton, Header, HealthBar, PressableScale, SectionLabel, StatusPill, Text, type StatusTone } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { podWindow, usePod, usePodMembers } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { useEndDay, useOpenWindow, useReplant, useTreeHistory, type PodDay } from '@/features/tree/hooks'
import { isLocal } from '@/lib/env'
import { firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/**
 * The pod's tree: where today stands, the tree, its stage and health,
 * how today will score, who has snapped, and one button.
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
  const next = STAGES[stage.level]
  const f = forecast(tree, pod.contributedToday, pod.memberCount)
  const w = podWindow(pod, now)
  const ratio = healthRatio(tree)
  const lastDay = history.data?.at(-1)
  const n = pod.memberCount
  const x = pod.contributedToday

  // Today so far, in one line.
  const [tone, headline]: [StatusTone, string] = dead
    ? ['bad', 'The tree is resting. Replant to grow again']
    : f.outcome === 'thrive'
      ? ['good', `All ${n} snapped. Tree grows +${f.hpDelta} HP tonight`]
      : w.status === 'closed'
        ? f.outcome === 'steady'
          ? ['neutral', `${x} of ${n} snapped. The tree holds tonight`]
          : ['warn', `${x} of ${n} snapped. Tree loses ${-f.hpDelta} HP tonight`]
        : f.outcome === 'steady'
          ? ['good', `${x} of ${n} in. ${f.toThrive} more and it grows`]
          : ['warn', `${f.toSteady} more ${f.toSteady === 1 ? 'snap' : 'snaps'} or it loses ${-f.hpDelta} HP`]

  const cta = dead
    ? { label: 'Replant the tree', onPress: () => replant.mutate(undefined, { onSuccess: () => haptics.success() }), loading: replant.isPending }
    : pod.meContributedToday
      ? { label: "You're done today", disabled: true }
      : w.status === 'open'
        ? { label: `Snap now · +${RULES.energyPerCheckin} energy`, onPress: () => router.navigate({ pathname: '/camera', params: { podId: id } }) }
        : w.status === 'upcoming'
          ? { label: `Opens at ${formatSnapTime(pod.snapTime)}`, disabled: true }
          : { label: 'Window closed for today', disabled: true }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title={pod.name} border={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <StatusPill tone={tone} label={headline} large />
        </View>

        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <TreeArt growth={pod.growth} dead={dead} size={300} />
          <Text style={{ fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 }}>{dead ? 'Resting' : stage.name}</Text>
          <Text style={{ fontSize: 17, color: colors.ink.muted, marginTop: 4 }}>
            Growth {pod.growth} · {next && stage.toNext !== null ? `${stage.toNext} perfect ${stage.toNext === 1 ? 'day' : 'days'} to ${next.name}` : 'top stage'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 28, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 19, fontWeight: '700' }}>Health</Text>
            <Text numeric style={{ fontSize: 26, fontWeight: '800' }}>
              {dead ? 0 : pod.hp}
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink.muted }}> / {pod.maxHp} HP</Text>
            </Text>
          </View>
          <HealthBar ratio={dead ? 0 : ratio} height={20} />
          <LastNight day={lastDay} />
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionLabel style={{ paddingHorizontal: 20, marginBottom: 8 }}>How today scores</SectionLabel>
          <ScoreRow pct="100%" label="Everyone snapped" result={`+${RULES.thriveHp} HP`} resultColor={colors.leaf.DEFAULT} active={!dead && f.outcome === 'thrive'} />
          <ScoreRow pct={`${Math.round(RULES.steadyThreshold * 100)}%+`} label="Most of the pod" result="No change" resultColor={colors.ink.muted} active={!dead && f.outcome === 'steady'} />
          <ScoreRow pct="Under" label={`Fewer than ${Math.round(RULES.steadyThreshold * 100)}%`} result="Loses HP" resultColor={colors.flame.deep} active={!dead && f.outcome === 'wilt'} />
          <Text style={{ paddingHorizontal: 20, marginTop: 12, fontSize: 16, lineHeight: 23, color: colors.ink.muted }}>At 0 HP the tree dies and the pod replants. Nothing else is lost.</Text>
        </View>

        {members.data?.length ? (
          <View style={{ paddingHorizontal: 20, marginTop: 28, gap: 14 }}>
            <SectionLabel>{!dead && f.outcome === 'thrive' ? 'Everyone earns a star tonight' : 'Snapped today'}</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {members.data.map((m) => (
                <View key={m.id} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${m.display_name}: ${m.contributedToday ? 'snapped' : 'not yet'}`}>
                  <Avatar person={m} size={64} ring={m.contributedToday ? 'done' : 'pending'} />
                  <Text style={{ fontSize: 14, color: colors.ink.muted }}>{m.id === me ? 'you' : firstName(m.display_name).toLowerCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {isLocal ? (
          <View style={{ gap: 8, padding: 14, marginHorizontal: 20, marginTop: 28, borderRadius: 14, backgroundColor: colors.raised }}>
            <SectionLabel>Demo tools · local only</SectionLabel>
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

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.canvas }}>
        <ChunkyButton {...cta} />
      </View>
    </View>
  )
}

const LAST_NIGHT: Record<DayOutcome, { color: string; text: (d: PodDay) => string }> = {
  thrive: { color: colors.leaf.DEFAULT, text: (d) => `${d.hpDelta > 0 ? `+${d.hpDelta} HP` : 'Full health'} last night. Everyone snapped` },
  steady: { color: colors.ink.muted, text: (d) => `No change last night. ${d.contributors} of ${d.members} snapped` },
  wilt: { color: colors.flame.deep, text: (d) => `${d.hpDelta} HP last night. ${d.contributors} of ${d.members} snapped` },
  dormant: { color: colors.ink.muted, text: () => 'Resting last night' },
}

/** What the last settled day did to the tree. */
function LastNight({ day }: { day: PodDay | undefined }) {
  if (!day) return <Text style={{ fontSize: 16, color: colors.ink.muted }}>{"The tree's first day ends tonight."}</Text>
  const s = LAST_NIGHT[day.outcome]
  return <Text style={{ fontSize: 16, fontWeight: '600', color: s.color }}>{s.text(day).replace(/^-/, '−')}</Text>
}

function ScoreRow({ pct, label, result, resultColor, active }: { pct: string; label: string; result: string; resultColor: string; active: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: active ? colors.leaf.soft : 'transparent' }} accessibilityState={{ selected: active }}>
      <Text style={{ width: 92, fontSize: 17, fontWeight: '700', color: active ? colors.leaf.DEFAULT : colors.ink.muted }}>{pct}</Text>
      <Text style={{ flex: 1, fontSize: 17, color: active ? colors.ink.DEFAULT : colors.ink.muted }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: resultColor }}>{result}</Text>
    </View>
  )
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} flex accessibilityLabel={label}>
      <View style={{ height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink.muted }}>{label}</Text>
      </View>
    </PressableScale>
  )
}
