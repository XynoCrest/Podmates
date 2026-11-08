import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import type { Profile } from '../../profile/hooks'
import type { StoryGroup } from '../../snaps/hooks'

/** Messenger/Instagram story row: "Your story" first, then each podmate's last-24h snaps. */
export function StoriesRow({ me, groups, habitId }: { me: Profile | undefined; groups: StoryGroup[]; habitId: string }) {
  const mine = groups.find((g) => g.person.id === me?.id)
  const others = groups.filter((g) => g.person.id !== me?.id)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 14 }}>
      {me ? (
        <PressableScale
          onPress={() => (mine ? router.push({ pathname: '/story/[userId]', params: { userId: me.id, habit: habitId } }) : router.navigate('/camera'))}
          accessibilityLabel={mine ? 'Your story' : 'Add to your story'}
        >
          <View style={{ alignItems: 'center', width: 72, gap: 6 }}>
            <View>
              <Avatar person={me} size={62} ring={mine ? 'seen' : undefined} />
              {!mine ? (
                <View style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink.DEFAULT, borderWidth: 3, borderColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={12} color={colors.ink.inverse} weight="bold" />
                </View>
              ) : null}
            </View>
            <Text variant="caption" numberOfLines={1}>
              {mine ? 'Your story' : 'Add snap'}
            </Text>
          </View>
        </PressableScale>
      ) : null}
      {others.map((g) => (
        <PressableScale key={g.person.id} onPress={() => router.push({ pathname: '/story/[userId]', params: { userId: g.person.id, habit: habitId } })} accessibilityLabel={`${g.person.display_name}'s story`}>
          <View style={{ alignItems: 'center', width: 72, gap: 6 }}>
            <Avatar person={g.person} size={62} ring={g.unseen ? 'unseen' : 'seen'} />
            <Text variant="caption" numberOfLines={1} style={{ color: g.unseen ? colors.ink.DEFAULT : colors.ink.muted }}>
              {firstName(g.person.display_name)}
            </Text>
          </View>
        </PressableScale>
      ))}
      {others.length === 0 ? (
        <View style={{ justifyContent: 'center', paddingRight: 24, height: 62 }}>
          <Text variant="caption">No snaps from your podmates in the last 24h.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}
