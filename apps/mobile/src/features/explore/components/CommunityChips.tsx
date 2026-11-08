import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { PressableScale, Text } from '@/components/ui'
import type { Community } from '../hooks'
import { CommunityIcon } from './PostCard'

/** Horizontal strip: joined communities first, then ones to discover. */
export function CommunityChips({ communities }: { communities: Community[] }) {
  const sorted = [...communities].sort((a, b) => Number(b.joined) - Number(a.joined))
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
      {sorted.map((c) => (
        <PressableScale key={c.id} onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: c.slug } })} scaleTo={0.95} accessibilityLabel={c.name}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingLeft: 4, paddingRight: 12, borderRadius: 18, backgroundColor: c.joined ? colors.raised : 'transparent', borderWidth: 1, borderColor: c.joined ? colors.raised : colors.line }}>
            <CommunityIcon name={c.name} color={c.color} size={28} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: c.joined ? colors.ink.DEFAULT : colors.ink.muted }}>{c.name}</Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  )
}
