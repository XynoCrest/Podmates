import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Share, View } from 'react-native'
import { Avatar, Icon, PressableScale, Text, type IconName } from '@/components/ui'
import { compact, timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { COMMUNITY_ICONS } from '../communityIcons'
import { useSharePost, useVote, type Post } from '../hooks'

/** Card: author header (photo, name, community underneath), media full-bleed, caption (title + body), then stats and vote arrows. */
export function PostCard({ post, full }: { post: Post; full?: boolean }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } })
  return (
    <View style={{ backgroundColor: colors.surface, paddingTop: 12 }}>
      <PostHeader post={post} />
      <PressableScale onPress={full ? undefined : open} disabled={full} scaleTo={0.99} accessibilityLabel={post.title}>
        {post.imageUrl ? (
          // Image posts: the photo first, the caption underneath.
          <View style={{ gap: 12 }}>
            <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.raised }} contentFit="cover" transition={200} />
            <Caption post={post} full={full} />
          </View>
        ) : (
          <Caption post={post} full={full} />
        )}
      </PressableScale>
      <PostMeta post={post} full={full} />
    </View>
  )
}

/** Title, then body text (always for text posts; on image posts only in the full view). */
function Caption({ post, full }: { post: Post; full?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ paddingHorizontal: 16, fontSize: full ? 21 : 18, lineHeight: full ? 27 : 24, fontWeight: full ? '600' : '500', color: colors.ink.DEFAULT }}>{post.title}</Text>
      {post.body && (full || !post.imageUrl) ? (
        <Text numberOfLines={full ? undefined : 3} style={{ paddingHorizontal: 16, fontSize: 15, lineHeight: 21, color: colors.ink.muted }}>
          {post.body}
        </Text>
      ) : null}
    </View>
  )
}

/** Who posted, and where: photo and username, the community underneath. */
function PostHeader({ post }: { post: Post }) {
  const glyph = COMMUNITY_ICONS[post.community.slug]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
      <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.author.id } })} scaleTo={0.95} accessibilityLabel={post.author.display_name}>
        <Avatar person={post.author} size={40} />
      </PressableScale>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.author.id } })} scaleTo={0.98} accessibilityLabel={post.author.display_name}>
          <Text numberOfLines={1} style={{ fontSize: 16, lineHeight: 20, fontWeight: '600', color: colors.ink.DEFAULT }}>
            {post.author.username}
          </Text>
        </PressableScale>
        <PressableScale onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: post.community.slug } })} scaleTo={0.98} accessibilityLabel={post.community.name}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {glyph ? <Icon name={glyph} size={13} color={colors.ink.muted} /> : null}
            <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 14, lineHeight: 18, color: colors.ink.muted }}>
              {post.community.name}
            </Text>
          </View>
        </PressableScale>
      </View>
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

/**
 * The action bar under a post, X-style: thumbs up (green) and thumbs down (red), each with its
 * count, comments with their count, share with its count; how long ago on the right. Outline
 * icons, filled when it's my vote.
 */
function PostMeta({ post, full }: { post: Post; full?: boolean }) {
  const vote = useVote()
  const sharePost = useSharePost()
  const cast = (value: -1 | 1) => {
    haptics.select()
    vote.mutate({ post, value })
  }
  const share = async () => {
    const result = await Share.share({ message: `${post.title} — on Podmates, in ${post.community.name}` })
    // Count it only if the sheet wasn't dismissed (Android always reports a share).
    if (result.action === Share.sharedAction) sharePost.mutate(post.id)
  }
  const up = post.myVote === 1
  const down = post.myVote === -1
  const ups = Math.max(0, post.score + post.downCount)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 2 }}>
      <Action icon={up ? 'thumbsUpFill' : 'thumbsUp'} label={`Thumbs up, ${ups}`} count={compact(ups)} color={colors.leaf.DEFAULT} active={up} onPress={() => cast(1)} />
      <Action icon={down ? 'thumbsDownFill' : 'thumbsDown'} label={`Thumbs down, ${post.downCount}`} count={compact(post.downCount)} color={colors.danger.DEFAULT} active={down} onPress={() => cast(-1)} />
      <Action
        icon="bubble"
        label={`${post.commentCount} comments`}
        count={compact(post.commentCount)}
        color={colors.ink.DEFAULT}
        onPress={full ? undefined : () => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      />
      <Action icon="sendPlane" label={`Share, ${post.shareCount} shares`} count={compact(post.shareCount)} color={colors.ink.DEFAULT} onPress={() => void share()} />
      <Text variant="caption" numeric style={{ marginLeft: 'auto', paddingRight: 8, color: colors.ink.subtle }}>
        {timeAgo(post.createdAt)}
      </Text>
    </View>
  )
}

function Action({ icon, label, count, color, active, onPress }: { icon: IconName; label: string; count?: string; color: string; active?: boolean; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.85} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={4}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 7 }}>
        <Icon name={icon} size={21} color={color} weight={active ? 'semibold' : 'regular'} />
        {count !== undefined ? (
          <Text numeric style={{ fontSize: 15, fontWeight: '600', color }}>
            {count}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  )
}
