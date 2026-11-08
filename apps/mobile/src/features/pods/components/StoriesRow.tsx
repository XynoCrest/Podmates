import { colors, ring } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useId } from 'react'
import { ScrollView, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import type { Profile } from '../../profile/hooks'
import type { StoryGroup } from '../../snaps/hooks'

const FACE = 66
const GAP = 4
const STROKE = 3
const OUTER = FACE + (GAP + STROKE) * 2
const TILE = 84

/** Instagram story row: "Your story" first with a + badge, then each podmate's last-24h snaps. */
export function StoriesRow({ me, groups, habitId }: { me: Profile | undefined; groups: StoryGroup[]; habitId: string }) {
  const mine = groups.find((g) => g.person.id === me?.id)
  const others = groups.filter((g) => g.person.id !== me?.id)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}>
      {me ? (
        <PressableScale
          onPress={() => (mine ? router.push({ pathname: '/story/[userId]', params: { userId: me.id, habit: habitId } }) : router.navigate('/camera'))}
          accessibilityLabel={mine ? 'Your story' : 'Add to your story'}
        >
          <View style={{ alignItems: 'center', width: TILE, gap: 6 }}>
            <View>
              <StoryAvatar person={me} seen={mine?.seen ?? []} />
              <PressableScale onPress={() => router.navigate('/camera')} accessibilityLabel="Add a snap" scaleTo={0.85} style={{ position: 'absolute', right: 0, bottom: 0 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink.DEFAULT, borderWidth: 3, borderColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={12} color={colors.ink.inverse} weight="bold" />
                </View>
              </PressableScale>
            </View>
            <Text variant="caption" numberOfLines={1} style={{ fontSize: 13, color: colors.ink.DEFAULT }}>
              Your story
            </Text>
          </View>
        </PressableScale>
      ) : null}
      {others.map((g) => (
        <PressableScale key={g.person.id} onPress={() => router.push({ pathname: '/story/[userId]', params: { userId: g.person.id, habit: habitId } })} accessibilityLabel={`${g.person.display_name}'s story, ${g.snaps.length} snap${g.snaps.length === 1 ? '' : 's'}`}>
          <View style={{ alignItems: 'center', width: TILE, gap: 6 }}>
            <StoryAvatar person={g.person} seen={g.seen} />
            <Text variant="caption" numberOfLines={1} style={{ fontSize: 13, color: g.unseen ? colors.ink.DEFAULT : colors.ink.muted }}>
              {firstName(g.person.display_name)}
            </Text>
          </View>
        </PressableScale>
      ))}
      {others.length === 0 ? (
        <View style={{ justifyContent: 'center', paddingRight: 24, height: OUTER }}>
          <Text variant="caption">No snaps from your podmates in the last 24h</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

/**
 * Avatar inside a ring broken into one arc per snap: gradient for unseen, grey for seen.
 * No snaps, no ring (the space is kept so tiles line up).
 */
function StoryAvatar({ person, seen }: { person: Profile | StoryGroup['person']; seen: boolean[] }) {
  const id = useId().replace(/:/g, '')
  const n = seen.length
  const c = OUTER / 2
  const r = c - STROKE / 2
  // Gap between arcs, in degrees; round caps eat into it, so pad by the cap's angular width.
  const gapDeg = n > 1 ? Math.min(14, 40 / n) + (STROKE / r) * (180 / Math.PI) : 0
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
  }
  return (
    <View style={{ width: OUTER, height: OUTER, alignItems: 'center', justifyContent: 'center' }}>
      {n > 0 ? (
        <Svg width={OUTER} height={OUTER} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={ring[0]} />
              <Stop offset="0.5" stopColor={ring[1]} />
              <Stop offset="1" stopColor={ring[2]} />
            </LinearGradient>
          </Defs>
          {n === 1 ? (
            <Circle cx={c} cy={c} r={r} stroke={seen[0] ? colors.ink.subtle : `url(#${id})`} strokeWidth={STROKE} fill="none" />
          ) : (
            seen.map((s, i) => {
              const span = 360 / n
              const a0 = i * span + gapDeg / 2
              const a1 = (i + 1) * span - gapDeg / 2
              return (
                <Path
                  key={i}
                  d={`M ${pt(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)}`}
                  stroke={s ? colors.ink.subtle : `url(#${id})`}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                />
              )
            })
          )}
        </Svg>
      ) : null}
      <Avatar person={person} size={FACE} />
    </View>
  )
}
