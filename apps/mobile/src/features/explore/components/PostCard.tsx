import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Platform, View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { compact, timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { useVote, type Post } from '../hooks'

export function PostCard({ post, full }: { post: Post; full?: boolean }) {
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } })
  return (
    <View
      style={{
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ paddingHorizontal: 15, paddingTop: 15 }}>
        <PressableScale
          onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: post.community.slug } })}
          accessibilityRole="button"
          accessibilityLabel={`${post.community.name} community, posted by ${post.author.username}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <CommunityIcon emoji={post.community.emoji} color={post.community.color} size={34} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700' }}>
                {post.community.name}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.ink.muted }}>
                by {post.author.username} · {timeAgo(post.createdAt)}
              </Text>
            </View>
          </View>
        </PressableScale>
      </View>
      <PressableScale
        onPress={full ? undefined : open}
        disabled={full}
        scaleTo={0.99}
        accessibilityRole={full ? undefined : 'button'}
        accessibilityLabel={full ? undefined : `Open post: ${post.title}`}
      >
        <View style={{ gap: 9, paddingHorizontal: 15, paddingTop: 13, paddingBottom: post.imageUrl ? 14 : 4 }}>
          <Text
            style={{
              fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
              fontSize: full ? 23 : 19,
              lineHeight: full ? 30 : 25,
              fontWeight: '700',
              letterSpacing: -0.3,
              color: colors.ink.DEFAULT,
            }}
          >
            {post.title}
          </Text>
          {post.body && (full || !post.imageUrl) ? (
            <Text numberOfLines={full ? undefined : 3} style={{ fontSize: 14, lineHeight: 21, color: colors.ink.muted }}>
              {post.body}
            </Text>
          ) : null}
        </View>
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: colors.raised }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Image for ${post.title}`}
          />
        ) : null}
      </PressableScale>
      <PostMeta post={post} />
    </View>
  )
}

export function CommunityIcon({ emoji, color, size = 26 }: { emoji: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColors[color as keyof typeof avatarColors] ?? colors.raised, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  )
}

function PostMeta({ post }: { post: Post }) {
  const vote = useVote()
  const cast = (value: -1 | 1) => {
    haptics.select()
    vote.mutate({ post, value })
  }
  return (
    <View style={{ paddingHorizontal: 11, paddingTop: 4, paddingBottom: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Text numeric style={{ fontSize: 13, color: colors.ink.muted }}>
            Score {compact(post.score)}
          </Text>
          <Meta icon="comment" label={compact(post.commentCount)} />
        </View>
        <VoteButton
          icon="thumbsUp"
          label="Thumbs up"
          active={post.myVote === 1}
          onPress={() => cast(1)}
          activeColor={colors.leaf.DEFAULT}
          activeBackground={colors.leaf.soft}
        />
        <VoteButton
          icon="thumbsDown"
          label="Thumbs down"
          active={post.myVote === -1}
          onPress={() => cast(-1)}
          activeColor={colors.danger.DEFAULT}
          activeBackground={colors.danger.soft}
        />
      </View>
      {vote.error ? (
        <Text accessibilityRole="alert" style={{ paddingHorizontal: 4, paddingTop: 3, color: colors.danger.DEFAULT, fontSize: 12 }}>
          Couldn’t save your reaction. Try again.
        </Text>
      ) : null}
    </View>
  )
}

function Meta({ icon, label }: { icon: 'comment'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={14} color={colors.ink.subtle} weight="medium" />
      <Text numeric style={{ fontSize: 13, color: colors.ink.muted }}>
        {label}
      </Text>
    </View>
  )
}

function VoteButton({
  icon,
  label,
  onPress,
  active,
  activeColor,
  activeBackground,
}: {
  icon: 'thumbsUp' | 'thumbsDown'
  label: string
  onPress: () => void
  active: boolean
  activeColor: string
  activeBackground: string
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Tap again to remove your reaction."
      accessibilityState={{ selected: active }}
      hitSlop={4}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? activeBackground : 'transparent',
        }}
      >
        <Icon name={icon} size={20} color={active ? activeColor : colors.ink.subtle} weight={active ? 'semibold' : 'regular'} />
      </View>
    </PressableScale>
  )
}
