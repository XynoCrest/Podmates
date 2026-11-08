import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { PressableScale, Text } from '@/components/ui'
import type { Community } from '../hooks'
import { CommunityIcon } from './PostCard'

export function CommunityChips({ communities }: { communities: Community[] }) {
  const joined = communities.filter((community) => community.joined)
  const discover = communities.filter((community) => !community.joined)

  return (
    <View style={{ paddingBottom: 8 }}>
      {joined.length > 0 ? <CommunityGroup title="Your communities" communities={joined} /> : null}
      {discover.length > 0 ? <CommunityGroup title="Find a community" communities={discover} /> : null}
    </View>
  )
}

function CommunityGroup({ title, communities }: { title: string; communities: Community[] }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text variant="caption" style={{ marginHorizontal: 20, marginBottom: 8, color: colors.ink.muted, fontWeight: '700' }}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 2, gap: 8 }}
      >
        {communities.map((community) => (
          <PressableScale
            key={community.id}
            onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: community.slug } })}
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityLabel={`${community.name}${community.joined ? '' : ', browse community'}`}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 40,
                paddingLeft: 6,
                paddingRight: 13,
                borderRadius: 14,
                backgroundColor: community.joined ? colors.leaf.soft : colors.surface,
                borderWidth: 1,
                borderColor: community.joined ? colors.leaf.deep : colors.line,
              }}
            >
              <CommunityIcon emoji={community.emoji} color={community.color} size={28} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: community.joined ? colors.ink.DEFAULT : colors.ink.muted }}>
                {community.name}
              </Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  )
}
