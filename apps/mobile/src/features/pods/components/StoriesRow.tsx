import { colors, radii } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { Profile } from '../../profile/hooks'
import type { StoryGroup } from '../../snaps/hooks'

const W = 72
const H = 96

/**
 * Today's snaps as a strip of photo tiles, one per podmate: the latest photo with
 * their face pinned to the corner. A green edge means you haven't seen it yet.
 */
export function StoriesRow({ me, groups, habitId }: { me: Profile | undefined; groups: StoryGroup[]; habitId: string }) {
  const mine = groups.find((g) => g.person.id === me?.id)
  const others = groups.filter((g) => g.person.id !== me?.id)
  const open = (userId: string) => router.push({ pathname: '/story/[userId]', params: { userId, habit: habitId } })
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
      {me ? (
        <PressableScale onPress={() => (mine ? open(me.id) : router.navigate('/camera'))} accessibilityLabel={mine ? 'Your snaps' : 'Snap now'}>
          <View style={{ width: W, gap: 8 }}>
            {mine ? (
              <SnapTile image={mine.snaps.at(-1)!.image} person={me} edge={colors.line} />
            ) : (
              <View style={{ width: W, height: H, borderRadius: radii.photo, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.lip, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={20} color={colors.ink.muted} />
              </View>
            )}
            <Text variant="caption" numberOfLines={1} center>
              {mine ? 'You' : 'Snap'}
            </Text>
          </View>
        </PressableScale>
      ) : null}
      {others.map((g) => (
        <PressableScale key={g.person.id} onPress={() => open(g.person.id)} accessibilityLabel={`${g.person.display_name}'s snaps`}>
          <View style={{ width: W, gap: 8 }}>
            <SnapTile image={g.snaps.at(-1)!.image} person={g.person} edge={g.unseen ? colors.leaf.DEFAULT : colors.line} />
            <Text variant="caption" numberOfLines={1} center style={{ color: g.unseen ? colors.ink.DEFAULT : colors.ink.subtle }}>
              {firstName(g.person.display_name)}
            </Text>
          </View>
        </PressableScale>
      ))}
      {others.length === 0 ? (
        <View style={{ justifyContent: 'center', height: H, paddingRight: 24, maxWidth: 220 }}>
          <Text variant="subhead">No podmate snaps in the last 24 hours</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

function SnapTile({ image, person, edge }: { image: string; person: Profile | StoryGroup['person']; edge: string }) {
  return (
    <View style={{ width: W, height: H, borderRadius: radii.photo, borderWidth: 2, borderColor: edge, padding: 2 }}>
      <Image source={{ uri: imageUri(image) }} style={{ flex: 1, borderRadius: radii.photo - 4, backgroundColor: colors.raised }} contentFit="cover" transition={150} />
      <View style={{ position: 'absolute', left: 8, bottom: 8 }}>
        <Avatar person={person} size={24} outline={colors.canvas} />
      </View>
    </View>
  )
}
