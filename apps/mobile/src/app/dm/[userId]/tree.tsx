import { formatSnapTime } from '@podmates/shared'
import { forecast, healthRatio, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Chip, ChunkyButton, ScreenState, StageScreen, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useEndPairDay, usePairHistory, usePairToday, usePairTree, useReplantPair } from '@/features/pairs/hooks'
import { podWindow } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { DemoTools, Headline, Hl, MemberRing, TreeStats, WeekStrip } from '@/features/tree/TreeParts'
import { isLocal } from '@/lib/env'
import { firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/**
 * A podmate pair's tree: the pod tree game for two. It grows when you both snap
 * (in any pod you share) and wilts when either of you misses.
 */
export default function PairTreeScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const me = useMe()
  const now = useNow(15_000)
  const mine = useProfile(me)
  const other = useProfile(userId)
  const { data: pair } = usePairTree(userId)
  const today = usePairToday(userId, now)
  const history = usePairHistory(userId)
  const replant = useReplantPair(userId)
  const endDay = useEndPairDay(userId)

  if (!pair || !other.data || !mine.data) return <View style={{ flex: 1, backgroundColor: colors.canvas }}><ScreenState fill loading /></View>

  const name = firstName(other.data.display_name)
  const dead = pair.status === 'dead'
  const ratio = healthRatio(pair)
  const stage = stageFor(pair.growth)
  const snapped = (today.data?.me ? 1 : 0) + (today.data?.other ? 1 : 0)
  const f = forecast(pair, snapped, 2)
  // Where I can still snap today: a shared pod whose window is open, else the next to open.
  const windows = today.shared.map((p) => ({ pod: p, w: podWindow(p, now) }))
  const open = windows.find((x) => x.w.status === 'open' && !x.pod.meContributedToday)
  const upcoming = windows.filter((x) => x.w.status === 'upcoming').sort((a, b) => a.pod.snapTime.localeCompare(b.pod.snapTime))[0]
  const allClosed = !open && !upcoming

  const cta = dead
    ? { label: 'Replant', onPress: () => replant.mutate(undefined, { onSuccess: () => haptics.success() }), loading: replant.isPending }
    : today.data?.me
      ? { label: "You're done today", disabled: true }
      : open
        ? { label: `Snap in ${open.pod.name}`, onPress: () => router.navigate({ pathname: '/camera', params: { podId: open.pod.id } }), color: colors.flame.DEFAULT, lip: colors.flame.deep }
        : upcoming
          ? { label: `Opens at ${formatSnapTime(upcoming.pod.snapTime)}`, disabled: true }
          : { label: 'Windows closed for today', disabled: true }

  const members = [
    { ...mine.data, contributedToday: !!today.data?.me },
    { ...other.data, contributedToday: !!today.data?.other },
  ]

  return (
    <StageScreen
      title={`You and ${name}`}
      right={<Chip size="md" icon="flame" label={String(pair.streak)} color={colors.flame.DEFAULT} bg={colors.raised} accessibilityLabel={`Your streak together: ${pair.streak} days`} />}
      footer={<ChunkyButton {...cta} />}
    >
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <TreeArt growth={pair.growth} health={ratio} dead={dead} size={260} />
        <MemberRing members={members} />
      </View>

      <Headline>
        {dead ? (
          <>
            Your tree <Hl color={colors.danger.DEFAULT}>{"didn't make it"}</Hl>. Plant a new seed together.
          </>
        ) : f.outcome === 'thrive' ? (
          <>
            You both snapped. Tonight the tree will <Hl color={colors.leaf.DEFAULT}>grow +{f.hpDelta} HP</Hl>.
          </>
        ) : allClosed ? (
          <>
            {snapped} of 2 snapped. <Hl color={colors.flame.DEFAULT}>The tree loses {-f.hpDelta} HP tonight.</Hl>
          </>
        ) : today.data?.me ? (
          <>
            Waiting on <Hl color={colors.flame.DEFAULT}>{name}</Hl> to keep the streak going.
          </>
        ) : (
          <>
            <Hl color={colors.flame.DEFAULT}>{snapped === 1 ? 'Your snap' : 'Both snaps'}</Hl> keep{snapped === 1 ? 's' : ''} the streak going tonight.
          </>
        )}
      </Headline>

      <TreeStats stage={stage} hp={dead ? 0 : pair.hp} maxHp={pair.maxHp} ratio={dead ? 0 : ratio} snapped={`${snapped} of 2 snapped today`} />

      <WeekStrip days={history.data ?? []} />

      <Text variant="caption" center>
        Snaps in any pod you share count{today.shared.length ? ` · ${today.shared.map((p) => p.name).join(', ')}` : ''}
      </Text>

      {isLocal ? (
        <DemoTools
          error={endDay.error ?? replant.error}
          actions={[{ label: endDay.isPending ? 'Settling…' : 'End the day now', onPress: () => endDay.mutate(undefined, { onSuccess: () => haptics.success() }) }]}
        />
      ) : null}
    </StageScreen>
  )
}
