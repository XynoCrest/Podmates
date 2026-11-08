import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { PressableScale, Text } from '@/components/ui'
import type { Community } from '../hooks'
import { CommunityIcon } from './PostCard'

/** Joined communities first, then ones to discover (outlined only). */
export function CommunityChips({ communities }: { communities: Community[] }) {
  const sorted = [...communities].sort((a, b) => Number(b.joined) - Number(a.joined))
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
      {sorted.map((c) => (
        <PressableScale key={c.id} onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: c.slug } })} accessibilityLabel={c.name}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingLeft: 6, paddingRight: 12, borderRadius: 12, borderWidth: 2, borderColor: c.joined ? colors.lip : colors.line, backgroundColor: c.joined ? colors.surface : 'transparent' }}>
            <CommunityIcon symbol={c.symbol} color={c.color} size={24} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.joined ? colors.ink.DEFAULT : colors.ink.muted }}>{c.name}</Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  )
}
