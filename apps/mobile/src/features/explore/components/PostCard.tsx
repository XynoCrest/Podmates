import { avatar as avatarColors, colors, radii } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Icon, Meta, PressableScale, SymbolIcon, Text, Tile } from '@/components/ui'
import { compact, timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useVote, type Post } from '../hooks'

/** A community post: where it's from, the title, an optional photo, then votes and replies. */
export function PostCard({ post, full }: { post: Post; full?: boolean }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } })
  return (
    <Tile onPress={full ? undefined : open} accessibilityLabel={post.title} style={{ padding: 16, gap: 12 }}>
      <PressableScale onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: post.community.slug } })} scaleTo={0.98} accessibilityLabel={post.community.name}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CommunityIcon symbol={post.community.symbol} color={post.community.color} size={24} />
          <Text variant="label" numberOfLines={1} style={{ color: colors.ink.muted, flexShrink: 1 }}>
            {post.community.name}
          </Text>
          <Text variant="caption">
            {post.author.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
      </PressableScale>
      <Text style={{ fontSize: full ? 20 : 17, lineHeight: full ? 26 : 23, fontWeight: '600' }}>{post.title}</Text>
      {post.body && (full || !post.imageUrl) ? (
        <Text variant="callout" numberOfLines={full ? undefined : 3} style={{ color: colors.ink.muted, lineHeight: 21 }}>
          {post.body}
        </Text>
      ) : null}
      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 3 / 2, borderRadius: radii.photo, backgroundColor: colors.raised }} contentFit="cover" transition={200} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Votes post={post} />
        <Meta icon="comment" label={`${compact(post.commentCount)} ${post.commentCount === 1 ? 'reply' : 'replies'}`} />
      </View>
    </Tile>
  )
}

export function CommunityIcon({ symbol, color, size = 28 }: { symbol: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: avatarColors[color as keyof typeof avatarColors] ?? colors.raised, alignItems: 'center', justifyContent: 'center' }}>
      <SymbolIcon name={symbol} size={Math.round(size * 0.55)} color={colors.ink.DEFAULT} />
    </View>
  )
}

/** One control: up · score · down. Your vote turns its arrow and the score green. */
function Votes({ post }: { post: Post }) {
  const vote = useVote()
  const cast = (value: -1 | 1) => {
    haptics.select()
    vote.mutate({ post, value })
  }
  const scoreColor = post.myVote !== 0 ? colors.leaf.DEFAULT : colors.ink.muted
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 12, borderWidth: 2, borderColor: colors.line }}>
      <Arrow icon="arrowUp" label="Upvote" active={post.myVote === 1} onPress={() => cast(1)} />
      <Text numeric style={{ minWidth: 36, textAlign: 'center', fontSize: 14, fontWeight: '600', color: scoreColor }}>
        {compact(post.score)}
      </Text>
      <Arrow icon="arrowDown" label="Downvote" active={post.myVote === -1} onPress={() => cast(-1)} />
    </View>
  )
}

function Arrow({ icon, label, onPress, active }: { icon: 'arrowUp' | 'arrowDown'; label: string; onPress: () => void; active: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}>
      {({ pressed }) => (
        <View style={{ width: 36, height: 32, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 }}>
          <Icon name={icon} size={16} color={active ? colors.leaf.DEFAULT : colors.ink.subtle} weight={active ? 'bold' : 'medium'} />
        </View>
      )}
    </Pressable>
  )
}
