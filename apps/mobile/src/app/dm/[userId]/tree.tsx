import { formatSnapTime } from '@podmates/shared'
import { forecast, healthRatio, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChunkyButton, HealthBar, IconButton, StreakCount, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useEndPairDay, usePairHistory, usePairToday, usePairTree, useReplantPair } from '@/features/pairs/hooks'
import { podWindow } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { DevButton, Headline, Hl, MemberRing, StatCell, WeekStrip } from '@/features/tree/TreeParts'
import { isLocal } from '@/lib/env'
import { firstName } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'
import { useNow } from '@/lib/useNow'

/**
 * A podmate pair's tree: the pod tree game for two. It grows when you both snap
 * (in any pod you share) and wilts when either of you misses.
 */
export default function PairTreeScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow(15_000)
  const mine = useProfile(me)
  const other = useProfile(userId)
  const { data: pair } = usePairTree(userId)
  const today = usePairToday(userId, now)
  const history = usePairHistory(userId)
  const replant = useReplantPair(userId)
  const endDay = useEndPairDay(userId)

  if (!pair || !other.data || !mine.data) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />

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
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 52 }}>
        <IconButton icon="close" label="Close" onPress={goBack} color={colors.ink.subtle} />
        <Text variant="headline" numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: colors.ink.muted }}>
          You and {name}
        </Text>
        <View style={{ paddingHorizontal: 10, minWidth: 40, alignItems: 'flex-end' }}>
          <StreakCount count={pair.streak} size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24, alignItems: 'stretch' }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TreeArt growth={pair.growth} health={ratio} dead={dead} size={260} />
          <MemberRing members={members} />
        </View>

        <Headline>
          {dead ? (
            <>
              Your tree <Hl color={colors.danger.DEFAULT}>ran out of energy</Hl>. Plant a new seed together.
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

        <View style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
          <StatCell label="Stage" value={stage.name} sub={`Level ${stage.level} of ${stage.levels}`} />
          <View style={{ width: 1, backgroundColor: colors.line }} />
          <StatCell label="Health" value={`${dead ? 0 : pair.hp}/${pair.maxHp}`} sub={`${snapped} of 2 snapped today`}>
            <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
              <HealthBar ratio={dead ? 0 : ratio} height={10} />
            </View>
          </StatCell>
        </View>

        <WeekStrip days={history.data ?? []} />

        <Text variant="caption" center>
          Snaps in any pod you share count{today.shared.length ? ` · ${today.shared.map((p) => p.name).join(', ')}` : ''}
        </Text>

        {isLocal ? (
          <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.surface }}>
            <Text variant="overline">Demo tools · local only</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DevButton label={endDay.isPending ? 'Settling…' : 'End the day now'} onPress={() => endDay.mutate(undefined, { onSuccess: () => haptics.success() })} />
            </View>
            {endDay.error || replant.error ? (
              <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
                {(endDay.error ?? replant.error)!.message}
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
