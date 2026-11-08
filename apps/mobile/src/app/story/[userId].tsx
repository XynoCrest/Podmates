import { router, useLocalSearchParams } from 'expo-router'
import { goBack } from '@/lib/nav'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useMe } from '@/ctx/session'
import { overlay } from '@podmates/ui-tokens'
import { Button, ScreenState } from '@/components/ui'
import { ProgressBars, SnapFrame } from '@/features/snaps/components/SnapFrame'
import { useMarkSeen, useStories } from '@/features/snaps/hooks'

const SNAP_MS = 5000

/** Stories: progress bars, tap right/left to step, auto-advance, then the next person. */
export default function StoryViewer() {
  const { userId, habit } = useLocalSearchParams<{ userId: string; habit: string }>()
  // Keyed by person so moving to the next person starts at their first snap.
  return <PersonStory key={userId} userId={userId} habit={habit} />
}

function PersonStory({ userId, habit }: { userId: string; habit: string }) {
  const me = useMe()
  const stories = useStories(habit)
  const markSeen = useMarkSeen(habit)
  const group = stories.groups.find((g) => g.person.id === userId)
  // The list re-sorts (unseen first) as snaps get marked seen, so "who's next" uses the order from
  // when the viewer opened; otherwise the person after the one you're watching can be skipped.
  const [order, setOrder] = useState<string[]>([])
  if (!order.length && stories.groups.length) setOrder(stories.groups.map((g) => g.person.id))
  // The position belongs to one person: moving to the next person starts at their first snap.
  const [pos, setPos] = useState({ userId, index: 0 })
  const rawIndex = pos.userId === userId ? pos.index : 0
  // A refetch can drop snaps (deleted, blocked, reported): stay within what's there.
  const index = group ? Math.min(rawIndex, group.snaps.length - 1) : 0
  const setIndex = (i: number) => setPos({ userId, index: i })
  const progress = useSharedValue(0)

  const snap = group?.snaps[index]

  function next() {
    if (!group) return
    if (index < group.snaps.length - 1) setIndex(index + 1)
    else {
      const ids = order.length ? order : stories.groups.map((g) => g.person.id)
      const nextId = ids.slice(ids.indexOf(userId) + 1).find((id) => id !== me && stories.groups.some((g) => g.person.id === id))
      if (nextId) router.setParams({ userId: nextId })
      else goBack()
    }
  }
  const prev = () => setIndex(Math.max(0, index - 1))

  useEffect(() => {
    if (!snap) return
    if (snap.author.id !== me) markSeen.mutate(snap.id)
    progress.value = 0
    progress.value = withTiming(1, { duration: SNAP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(next)
    })
    return () => cancelAnimation(progress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap?.id])

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))

  if (!snap || !group) {
    // Nothing (left) to show for this person, e.g. you blocked them or their snaps expired: say so instead of a blank screen.
    return (
      <View style={{ flex: 1, backgroundColor: overlay.media }}>
        <ScreenState fill loading={stories.isLoading} tone="media" empty={stories.isLoading ? undefined : { icon: 'photo', title: 'No story to show', action: <Button label="Close" variant="secondary" size="sm" onPress={goBack} /> }} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <SnapFrame
        snap={snap}
        top={
          <ProgressBars count={group.snaps.length} index={index} current={<Animated.View style={[{ height: '100%', backgroundColor: overlay.ink }, bar]} />} />
        }
      />
      {/* Tap zones sit below the top bar so the close button stays reachable. */}
      <View style={{ position: 'absolute', top: 120, bottom: 140, left: 0, right: 0, flexDirection: 'row' }}>
        <Pressable style={{ flex: 1 }} onPress={prev} accessibilityLabel="Previous snap" />
        <Pressable style={{ flex: 2 }} onPress={next} accessibilityLabel="Next snap" />
      </View>
    </View>
  )
}
