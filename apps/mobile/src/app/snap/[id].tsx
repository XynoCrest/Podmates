import { useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, useWindowDimensions, View } from 'react-native'
import { overlay } from '@podmates/ui-tokens'
import { Button, ScreenState } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { SnapFrame } from '@/features/snaps/components/SnapFrame'
import { useProfileBoard, useSnap, useToggleOnProfile, type Snap } from '@/features/snaps/hooks'
import { haptics } from '@/lib/haptics'

/**
 * One snap, opened from chat or a profile board. Opened from a board (`board` = whose profile),
 * it's a vertical feed of that board, like Reels: swipe up or down for the next or previous snap,
 * one full screen at a time, starting at the one you tapped. Your own snaps can be pinned to your
 * profile.
 */
export default function SnapScreen() {
  const { id, board } = useLocalSearchParams<{ id: string; board?: string }>()
  return board ? <BoardFeed userId={board} startId={id} /> : <SingleSnap id={id} />
}

function SingleSnap({ id }: { id: string }) {
  const snap = useSnap(id)
  if (!snap.data) return <View style={{ flex: 1, backgroundColor: overlay.media }}><ScreenState fill loading={snap.isLoading} error={snap.error} tone="media" /></View>
  return <SnapFrame snap={snap.data} footer={<PinButton snap={snap.data} />} />
}

function BoardFeed({ userId, startId }: { userId: string; startId: string }) {
  const board = useProfileBoard(userId)
  const { height } = useWindowDimensions()
  // Fix the list when the feed opens: un-pinning a snap while watching shouldn't make the feed jump.
  const [snaps, setSnaps] = useState<Snap[] | null>(null)
  if (!snaps && board.data) setSnaps(board.data)
  const start = useMemo(() => Math.max(0, snaps?.findIndex((s) => s.id === startId) ?? 0), [snaps, startId])

  if (!snaps?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: overlay.media }}>
        <ScreenState fill loading={board.isLoading} error={board.error} onRetry={() => void board.refetch()} tone="media" />
      </View>
    )
  }
  return (
    <FlatList
      data={snaps}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <View style={{ height }}>
          <SnapFrame snap={item} footer={<PinButton snap={item} />} />
        </View>
      )}
      pagingEnabled
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      initialScrollIndex={start}
      getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      windowSize={3}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      style={{ flex: 1, backgroundColor: overlay.media }}
      accessibilityHint="Swipe up or down for the next or previous snap"
    />
  )
}

/** On your own snap: show it on, or take it off, your profile board. */
function PinButton({ snap }: { snap: Snap }) {
  const me = useMe()
  const queryClient = useQueryClient()
  const toggle = useToggleOnProfile(snap.habitId)
  const [onProfile, setOnProfile] = useState(snap.onProfile)
  if (snap.author.id !== me) return null
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={onProfile ? 'check' : 'grid'}
      label={onProfile ? 'On your profile' : 'Show on profile'}
      loading={toggle.isPending}
      onPress={() =>
        toggle.mutate(
          { snapId: snap.id, onProfile: !onProfile },
          {
            onSuccess: () => {
              haptics.success()
              setOnProfile(!onProfile)
              void queryClient.invalidateQueries({ queryKey: ['snap', snap.id] })
            },
          },
        )
      }
    />
  )
}
