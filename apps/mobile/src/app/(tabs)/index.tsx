import { healthRatio } from '@podmates/tree-engine'
import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, glyphFor } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { HomeView, type PodItem, type PodmateItem, type RailItem } from '@/features/pods/components/HomeView'
import { WindowBanner } from '@/features/pods/components/WindowBanner'
import { needsSnap, podWindow, useHabits, useMyHabits, useMyPods, usePodMembers, type PodSummary } from '@/features/pods/hooks'
import { useStories } from '@/features/snaps/hooks'
import { firstName, timeAgo } from '@/lib/format'
import { useNow } from '@/lib/useNow'

/** Home: streak rings per habit → the podmates on that habit → your pods and their health. */
export default function PodsScreen() {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow()
  const pods = useMyPods()
  const habits = useHabits()
  const myHabits = useMyHabits()
  const [picked, setHabitId] = useState<string>()
  // Until a ring is tapped: the first habit with a window open for me, else the first ring.
  const habitId =
    picked && myHabits.data.some((h) => h.id === picked)
      ? picked
      : (pods.data?.find((p) => needsSnap(p, now))?.habitId ?? myHabits.data[0]?.id)

  const stories = useStories(habitId)
  const inHabit = useMemo(() => pods.data?.filter((p) => p.habitId === habitId) ?? [], [pods.data, habitId])
  const urgent = inHabit.find((p) => needsSnap(p, now))
  // Podmates come from the pod that needs you most on this habit; most people have one per habit.
  const members = usePodMembers(urgent ?? inHabit[0])
  const unseen = useMemo(() => new Set(stories.groups.filter((g) => g.unseen).map((g) => g.person.id)), [stories.groups])

  const rail: RailItem[] = myHabits.data.map((habit) => {
    const mine = pods.data?.filter((p) => p.habitId === habit.id) ?? []
    return {
      id: habit.id,
      label: habit.name,
      glyph: glyphFor(habit.name),
      streak: Math.max(0, ...mine.map((p) => p.myStreak)),
      done: mine.length > 0 && mine.every((p) => p.meContributedToday),
    }
  })

  const habitName = habits.data?.find((h) => h.id === habitId)?.name
  const podmates: PodmateItem[] = (members.data ?? [])
    .filter((m) => m.id !== me)
    .map((m) => ({
      id: m.id,
      person: m,
      sub: `${habitName ?? 'Habit'} · ${windowPhrase(urgent ?? inHabit[0], now)}`,
      glyph: glyphFor(habitName),
      streak: m.streak,
      fresh: unseen.has(m.id),
      tint: m.contributedToday ? colors.leaf.DEFAULT : colors.ink.muted,
    }))

  const podItems: PodItem[] = (pods.data ?? []).map((pod) => ({
    id: pod.id,
    name: pod.name,
    sub: lastActivity(pod),
    // Pods have no photo of their own, so the round avatar falls back to initials.
    person: { display_name: pod.name, avatar_color: podColor(pod.id) },
    ratio: pod.treeStatus === 'dead' ? 0 : healthRatio({ hp: pod.hp, maxHp: pod.maxHp }),
  }))

  if (pods.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
      </View>
    )
  }

  if (!pods.data?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
        <EmptyState
          emoji="🌱"
          title="No pods yet"
          body="A pod is a few friends tracking one habit together. Snap daily, grow a tree."
          action={<Button label="Start or join a pod" icon="plus" onPress={() => router.push('/pod/new')} />}
        />
      </View>
    )
  }

  return (
    <HomeView
      rail={rail}
      podmates={podmates}
      pods={podItems}
      header={urgent ? <WindowBanner pod={urgent} now={now} /> : null}
      onOpenHabit={setHabitId}
      onAddHabit={() => router.push('/pod/new')}
      onOpenMessages={() => router.navigate('/explore')}
      onOpenPodmate={(id) => router.push({ pathname: '/user/[id]', params: { id } })}
      onOpenPod={(id) => router.push({ pathname: '/pod/[id]', params: { id } })}
      refreshing={pods.isRefetching}
      onRefresh={() => {
        void pods.refetch()
        void stories.refetch()
      }}
    />
  )
}

/** "22 min left" while the window is open, else when it next opens. */
function windowPhrase(pod: PodSummary | undefined, now: Date): string {
  if (!pod) return 'No window today'
  const w = podWindow(pod, now)
  if (w.status === 'open') return `${w.closesInMin} min left`
  if (w.status === 'upcoming') return w.opensInMin < 60 ? `opens in ${w.opensInMin} min` : `opens in ${Math.round(w.opensInMin / 60)} hrs`
  return 'window closed'
}

function lastActivity(pod: PodSummary): string {
  const who = pod.lastMessage?.author
  if (!who) return pod.goal
  const ago = timeAgo(pod.lastActivityAt)
  return `${firstName(who)} posted ${ago === 'now' ? 'just now' : `${ago} ago`}`
}

const PALETTE = Object.keys(avatarColors)

/** Stable per-pod avatar colour, so a pod keeps the same badge between launches. */
function podColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997
  return PALETTE[hash % PALETTE.length]!
}
