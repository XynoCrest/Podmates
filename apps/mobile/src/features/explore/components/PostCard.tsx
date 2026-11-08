import { avatar as avatarColors, avatarSoft, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { compact, timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useVote, type Community, type Post } from '../hooks'

/** "p/reading" — how a community is named everywhere. */
export const communityLabel = (c: { slug: string }) => `p/${c.slug}`

/** "3 hr", "1 d" — the feed's relative age. */
export function age(iso: string) {
  const t = timeAgo(iso)
  return t === 'now' ? 'now' : t.replace(/(\d+)([mhdw])$/, (_, n: string, u: string) => `${n} ${{ m: 'min', h: 'hr', d: 'd', w: 'w' }[u]}`)
}

/** Feed row: vote column on the left; community · author · age, title, image, comment count on the right. */
export function PostRow({ post, showCommunity = true }: { post: Post; showCommunity?: boolean }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } })
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 18, gap: 16 }}>
      <VoteColumn post={post} />
      <PressableScale onPress={open} scaleTo={0.99} flex accessibilityLabel={post.title}>
        <View style={{ gap: 6 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink.muted }}>
            {showCommunity ? `${communityLabel(post.community)} · ` : ''}
            {post.author.username} · {age(post.createdAt)}
          </Text>
          <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 }}>{post.title}</Text>
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 3 / 2, borderRadius: 12, backgroundColor: colors.raised, marginTop: 4 }} contentFit="cover" transition={200} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Icon name="comment" size={16} color={colors.ink.muted} />
            <Text style={{ fontSize: 16, color: colors.ink.muted }}>
              {compact(post.commentCount)} {post.commentCount === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
        </View>
      </PressableScale>
    </View>
  )
}

/** Up arrow · score · down arrow. Green when upvoted, blue when downvoted. */
export function VoteColumn({ post, horizontal }: { post: Post; horizontal?: boolean }) {
  const vote = useVote()
  const cast = (value: -1 | 1) => {
    haptics.select()
    vote.mutate({ post, value })
  }
  const scoreColor = post.myVote === 1 ? colors.leaf.DEFAULT : post.myVote === -1 ? colors.sky.DEFAULT : colors.ink.DEFAULT
  return (
    <View style={{ flexDirection: horizontal ? 'row' : 'column', alignItems: 'center', gap: horizontal ? 18 : 8, minWidth: 44 }}>
      <Arrow dir="up" active={post.myVote === 1} onPress={() => cast(1)} />
      <Text numeric style={{ fontSize: 19, fontWeight: '800', color: scoreColor }}>
        {compact(post.score)}
      </Text>
      <Arrow dir="down" active={post.myVote === -1} onPress={() => cast(-1)} />
    </View>
  )
}

function Arrow({ dir, active, onPress }: { dir: 'up' | 'down'; active: boolean; onPress: () => void }) {
  const color = active ? (dir === 'up' ? colors.leaf.DEFAULT : colors.sky.DEFAULT) : colors.ink.muted
  return (
    <PressableScale onPress={onPress} scaleTo={0.85} accessibilityRole="button" accessibilityLabel={dir === 'up' ? 'Upvote' : 'Downvote'} accessibilityState={{ selected: active }} hitSlop={8}>
      <Icon name={dir === 'up' ? 'arrowUp' : 'arrowDown'} size={22} color={color} weight={active ? 'bold' : 'medium'} />
    </PressableScale>
  )
}

/** Community badge: its initial on the community colour's soft tint. */
export function CommunityIcon({ community, size = 56 }: { community: Pick<Community, 'slug' | 'color'>; size?: number }) {
  const key = community.color as keyof typeof avatarColors
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarSoft[key] ?? colors.raised, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: avatarColors[key] ?? colors.ink.muted }}>{community.slug[0]?.toUpperCase()}</Text>
    </View>
  )
}

/** Community list row: badge · p/name · member count · chevron. */
export function CommunityRow({ community }: { community: Community }) {
  return (
    <PressableScale onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: community.slug } })} scaleTo={0.98} accessibilityLabel={communityLabel(community)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 10 }}>
        <CommunityIcon community={community} size={60} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 19, fontWeight: '700' }}>
            {communityLabel(community)}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 16, color: colors.ink.muted }}>
            {community.memberCount.toLocaleString()} members{community.joined ? '' : ' · not joined'}
          </Text>
        </View>
        <Icon name="chevronRight" size={22} color={colors.ink.muted} />
      </View>
    </PressableScale>
  )
}
