import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { compact, timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useVote, type Post } from '../hooks'

/** Apollo-style card: title first, media full-bleed, community · author, stats, and vote arrows on the right. */
export function PostCard({ post, full }: { post: Post; full?: boolean }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } })
  return (
    <View style={{ backgroundColor: colors.surface, paddingTop: 16 }}>
      <PressableScale onPress={full ? undefined : open} disabled={full} scaleTo={0.99} accessibilityLabel={post.title}>
        <View style={{ gap: 10 }}>
          <Text style={{ paddingHorizontal: 16, fontSize: full ? 21 : 18, lineHeight: full ? 27 : 24, fontWeight: full ? '600' : '500', color: colors.ink.DEFAULT }}>{post.title}</Text>
          {post.body && (full || !post.imageUrl) ? (
            <Text numberOfLines={full ? undefined : 3} style={{ paddingHorizontal: 16, fontSize: 15, lineHeight: 21, color: colors.ink.muted }}>
              {post.body}
            </Text>
          ) : null}
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.raised }} contentFit="cover" transition={200} /> : null}
        </View>
      </PressableScale>
      <PostMeta post={post} />
    </View>
  )
}

/** Community mark: its initial on its colour, like a person's avatar. */
export function CommunityIcon({ name, color, size = 26 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColors[color as keyof typeof avatarColors] ?? colors.raised, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.6), fontWeight: '600', color: '#fff' }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  )
}

function PostMeta({ post }: { post: Post }) {
  const vote = useVote()
  const cast = (value: -1 | 1) => {
    haptics.select()
    vote.mutate({ post, value })
  }
  const scoreColor = post.myVote === 1 ? colors.flame.DEFAULT : post.myVote === -1 ? colors.sky.DEFAULT : colors.ink.subtle
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <PressableScale onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: post.community.slug } })} scaleTo={0.98} accessibilityLabel={post.community.name}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CommunityIcon name={post.community.name} color={post.community.color} size={22} />
            <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink.muted, flexShrink: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink.muted }}>{post.community.name}</Text> by {post.author.username}
            </Text>
          </View>
        </PressableScale>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Meta icon="arrowUp" label={compact(post.score)} color={scoreColor} />
          <Meta icon="comment" label={compact(post.commentCount)} />
          <Meta icon="clock" label={timeAgo(post.createdAt)} />
        </View>
      </View>
      <Arrow icon="more" label="More" onPress={() => {}} color={colors.ink.subtle} />
      <Arrow icon="arrowUp" label="Upvote" onPress={() => cast(1)} color={post.myVote === 1 ? colors.flame.DEFAULT : colors.ink.subtle} active={post.myVote === 1} />
      <Arrow icon="arrowDown" label="Downvote" onPress={() => cast(-1)} color={post.myVote === -1 ? colors.sky.DEFAULT : colors.ink.subtle} active={post.myVote === -1} />
    </View>
  )
}

function Meta({ icon, label, color = colors.ink.subtle }: { icon: 'arrowUp' | 'comment' | 'clock'; label: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={14} color={color} weight="medium" />
      <Text numeric style={{ fontSize: 15, color }}>
        {label}
      </Text>
    </View>
  )
}

function Arrow({ icon, label, onPress, color, active }: { icon: 'arrowUp' | 'arrowDown' | 'more'; label: string; onPress: () => void; color: string; active?: boolean }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.85} accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={4}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.raised : 'transparent' }}>
        <Icon name={icon} size={20} color={color} weight={active ? 'bold' : 'regular'} />
      </View>
    </PressableScale>
  )
}
