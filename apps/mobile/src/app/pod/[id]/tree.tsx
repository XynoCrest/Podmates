import { formatSnapTime } from '@podmates/shared'
import { forecast } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Chip, ChunkyButton, ScreenState, StageScreen } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { podWindow, usePod, usePodMembers } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { healthTotal, shareHealth } from '@/features/tree/healthShare'
import { DemoTools, Headline, HealthStamp, Hl, MemberRing, WeekStrip } from '@/features/tree/TreeParts'
import { useEndDay, useOpenWindow, useReplant, useTreeHistory } from '@/features/tree/hooks'
import { isLocal } from '@/lib/env'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/**
 * The pod's tree — a game screen: one big illustration, one sentence saying
 * what today means for it, two numbers, one big button.
 */
export default function TreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const now = useNow(15_000)
  const { data: pod } = usePod(id)
  const members = usePodMembers(pod)
  const history = useTreeHistory(id)
  const replant = useReplant(id)
  const endDay = useEndDay(id)
  const openWindow = useOpenWindow(id)

  if (!pod) return <View style={{ flex: 1, backgroundColor: colors.canvas }}><ScreenState fill loading /></View>

  const dead = pod.treeStatus === 'dead'
  const tree = { hp: pod.hp, maxHp: pod.maxHp, growth: pod.growth, status: pod.treeStatus }
  const f = forecast(tree, pod.contributedToday, pod.memberCount)
  const w = podWindow(pod, now)
  const myStats = members.data?.find((m) => m.id === me)
  const shares = shareHealth(members.data ?? [])
  const shown = dead ? 0 : healthTotal(shares)
  const ratio = shown / 100

  const cta = dead
    ? { label: 'Replant', onPress: () => replant.mutate(undefined, { onSuccess: () => haptics.success() }), loading: replant.isPending }
    : pod.meContributedToday
      ? { label: "You're done today", disabled: true }
      : w.status === 'open'
        ? { label: 'Snap now', onPress: () => router.navigate({ pathname: '/camera', params: { podId: id } }), color: colors.flame.DEFAULT, lip: colors.flame.deep }
        : w.status === 'upcoming'
          ? { label: `Opens at ${formatSnapTime(pod.snapTime)}`, disabled: true }
          : { label: 'Window closed for today', disabled: true }

  return (
    <StageScreen
      title={pod.name}
      right={<Chip size="md" icon="flame" label={String(myStats?.streak ?? 0)} color={colors.flame.DEFAULT} bg={colors.raised} accessibilityLabel={`Your streak: ${myStats?.streak ?? 0} days`} />}
      footer={<ChunkyButton {...cta} />}
    >
      <View style={{ alignItems: 'center', marginTop: 8, width: '100%' }}>
        <View style={{ width: 280, alignItems: 'center' }}>
          <TreeArt growth={pod.growth} health={ratio} dead={dead} size={260} />
          <View style={{ position: 'absolute', top: 8, right: 0 }}>
            <HealthStamp percent={shown} />
          </View>
        </View>
        <MemberRing
          members={(members.data ?? []).map((m) => {
            const s = shares.find((x) => x.id === m.id)
            return { ...m, share: dead ? 0 : s?.share, dragging: s?.dragging }
          })}
        />
      </View>

      <Headline>
        {dead ? (
          <>
            The tree <Hl color={colors.danger.DEFAULT}>{"didn't make it"}</Hl>. Plant a new seed together.
          </>
        ) : f.outcome === 'thrive' ? (
          <>
            Everyone snapped. Tonight the tree will <Hl color={colors.leaf.DEFAULT}>grow +{f.hpDelta} HP</Hl>.
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

      <WeekStrip days={history.data ?? []} />

      {isLocal ? (
        <DemoTools
          error={openWindow.error ?? endDay.error ?? replant.error}
          actions={[
            { label: openWindow.isPending ? 'Opening…' : 'Open window now', onPress: () => openWindow.mutate() },
            { label: endDay.isPending ? 'Settling…' : 'End the day now', onPress: () => endDay.mutate(undefined, { onSuccess: () => haptics.success() }) },
          ]}
        />
      ) : null}
    </StageScreen>
  )
}
