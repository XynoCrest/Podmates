import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import type { Profile } from '../../profile/hooks'
import type { StoryGroup } from '../../snaps/hooks'

const SIZE = 76

/** Story row: "Your snap" first, then each podmate's last-24h snaps (green ring = not watched yet). */
export function StoriesRow({ me, groups, habitId }: { me: Profile | undefined; groups: StoryGroup[]; habitId: string }) {
  const mine = groups.find((g) => g.person.id === me?.id)
  const others = groups.filter((g) => g.person.id !== me?.id)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 18 }}>
      {me ? (
        <PressableScale
          onPress={() => (mine ? router.push({ pathname: '/story/[userId]', params: { userId: me.id, habit: habitId } }) : router.navigate('/camera'))}
          accessibilityLabel={mine ? 'Your snap' : 'Add your snap'}
        >
          <View style={{ alignItems: 'center', width: SIZE + 8, gap: 8 }}>
            {mine ? (
              <Avatar person={me} size={SIZE} ring="seen" />
            ) : (
              <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.ink.subtle, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={26} color={colors.ink.muted} />
              </View>
            )}
            <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink.muted }}>
              Your snap
            </Text>
          </View>
        </PressableScale>
      ) : null}
      {others.map((g) => (
        <PressableScale key={g.person.id} onPress={() => router.push({ pathname: '/story/[userId]', params: { userId: g.person.id, habit: habitId } })} accessibilityLabel={`${g.person.display_name}'s snaps`}>
          <View style={{ alignItems: 'center', width: SIZE + 8, gap: 8 }}>
            <Avatar person={g.person} size={SIZE} ring={g.unseen ? 'unseen' : 'seen'} />
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: g.unseen ? '700' : '400', color: g.unseen ? colors.ink.DEFAULT : colors.ink.muted }}>
              {firstName(g.person.display_name).toLowerCase()}
            </Text>
          </View>
        </PressableScale>
      ))}
      {others.length === 0 ? (
        <View style={{ justifyContent: 'center', paddingRight: 24, height: SIZE }}>
          <Text variant="subhead">No snaps from your podmates in the last 24h.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}
