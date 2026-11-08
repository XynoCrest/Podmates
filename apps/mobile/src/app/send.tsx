import { formatSnapTime } from '@podmates/shared'
import { colors, radii, space } from '@podmates/ui-tokens'
import { BlurTargetView, BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Button, Icon, ListRow, ScreenState, Section, SheetScreen, Text, TextField } from '@/components/ui'
import { podWindow, useHabits, useMyPods, type PodSummary } from '@/features/pods/hooks'
import { useSendSnap } from '@/features/snaps/hooks'
import { takePendingCapture } from '@/features/snaps/pendingCapture'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/** After the shutter: caption + pick which pods get this snap. Open windows are preselected. */
export default function SendSheet() {
  // `uri` param is only for http(s) demo links; real captures come through memory (see pendingCapture.ts).
  const params = useLocalSearchParams<{ uri?: string; podId?: string }>()
  const podId = params.podId
  const [uri] = useState(() => params.uri ?? takePendingCapture() ?? '')
  const now = useNow()
  const pods = useMyPods()
  const habits = useHabits()
  const send = useSendSnap()
  const [caption, setCaption] = useState('')
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [burst, setBurst] = useState(false)
  const afterBurst = useRef<(() => void) | null>(null)
  const blurTarget = useRef<ComponentRef<typeof View>>(null)

  // Only pods whose tree is alive can take a snap (a dead tree is replanted first), so only they are listed and picked.
  const sendable = useMemo(() => pods.data?.filter((p) => p.treeStatus === 'alive') ?? [], [pods.data])
  // Default selection: the pod we came from, else every pod with an open window I haven't snapped for.
  const defaults = useMemo(() => {
    if (podId && sendable.some((p) => p.id === podId)) return new Set([podId])
    return new Set(sendable.filter((p) => !p.meContributedToday && podWindow(p, now).status === 'open').map((p) => p.id))
  }, [podId, sendable, now])
  const selected = picked ?? defaults

  const grouped = useMemo(() => {
    const out: { habit: string; pods: PodSummary[] }[] = []
    for (const h of habits.data ?? []) {
      const list = sendable.filter((p) => p.habitId === h.id)
      if (list.length) out.push({ habit: h.name, pods: list })
    }
    return out
  }, [habits.data, sendable])

  const toggle = (id: string) => {
    haptics.select()
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const chosen = sendable.filter((p) => selected.has(p.id))
  const noPods = !pods.isLoading && !habits.isLoading && grouped.length === 0

  async function submit() {
    if (!chosen.length) return
    try {
      const rows = await send.mutateAsync({ uri, caption: caption.trim(), pods: chosen })
      haptics.success()
      afterBurst.current = () => {
        router.dismissAll()
        if (rows.length === 1) router.push({ pathname: '/pod/[id]', params: { id: rows[0]!.pod_id } })
        else router.navigate('/')
      }
      setBurst(true)
    } catch {
      haptics.error()
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
    <BlurTargetView ref={blurTarget} collapsable={false} style={StyleSheet.absoluteFill}>
    <SheetScreen
      title="Send to"
      subtitle={noPods ? undefined : 'Pods with an open window are picked for you.'}
      error={send.error?.message}
      action={
        noPods ? undefined : (
        <Button
          size="lg"
          icon="paperplane"
          label={chosen.length ? `Send to ${chosen.length} ${chosen.length === 1 ? 'pod' : 'pods'}` : 'Pick a pod'}
          disabled={!chosen.length || burst}
          loading={send.isPending || burst}
          onPress={submit}
        />
        )
      }
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Image source={{ uri }} style={{ width: 96, height: 128, borderRadius: radii.card, backgroundColor: colors.raised }} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <TextField value={caption} onChangeText={setCaption} placeholder="Add a caption…" maxLength={200} multiline style={{ minHeight: 128 }} />
        </View>
      </View>

      {noPods ? (
        <ScreenState
          empty={{
            icon: 'tree',
            title: pods.data?.length ? 'No pod can take a snap' : 'No pods yet',
            body: pods.data?.length ? 'Your pods’ trees need replanting first. Open a pod to replant it.' : 'Snaps go to a pod. Start one or join a friend’s, then snap again.',
            action: pods.data?.length ? undefined : <Button label="Start or join a pod" icon="plus" onPress={() => { router.dismissAll(); router.push('/pod/new') }} />,
          }}
        />
      ) : null}

      {grouped.map((g) => (
        <Section key={g.habit} label={g.habit}>
          <View style={{ borderRadius: radii.card, backgroundColor: colors.raised, overflow: 'hidden' }}>
            {g.pods.map((p, i) => (
              <View key={p.id} style={{ borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: colors.line }}>
                <PodChoice pod={p} now={now} checked={selected.has(p.id)} onPress={() => toggle(p.id)} />
              </View>
            ))}
          </View>
        </Section>
      ))}
    </SheetScreen>
    </BlurTargetView>
      {burst ? <StreakBurst blurTarget={blurTarget} onDone={() => afterBurst.current?.()} /> : null}
    </View>
  )
}

/** Firework after a snap. Blur stays on this screen — a nested modal blanks the sheet and sticks on iPhone. */
const BURST_MS = 2440
const GIF_W = 250
const GIF_H = 364

function StreakBurst({
  blurTarget,
  onDone,
}: {
  blurTarget: RefObject<ComponentRef<typeof View> | null>
  onDone: () => void
}) {
  const done = useRef(onDone)
  done.current = onDone
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const hold = setTimeout(() => done.current(), BURST_MS)
    return () => clearTimeout(hold)
  }, [])

  return (
    <View
      accessibilityViewIsModal
      accessibilityLabel="Streak sent"
      pointerEvents="auto"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { zIndex: 20 }]}
    >
      <BlurView
        blurTarget={blurTarget}
        {...(Platform.OS === 'android' ? { blurMethod: 'dimezisBlurView' as const } : {})}
        intensity={40}
        tint="systemThinMaterialDark"
        style={StyleSheet.absoluteFill}
      />
      {box.w > 0 ? (
        <Image
          source={require('../../assets/images/streak-firework.gif')}
          style={{ position: 'absolute', width: GIF_W, height: GIF_H, left: (box.w - GIF_W) / 2, top: (box.h - GIF_H) / 2 }}
          contentFit="contain"
          contentPosition="center"
          autoplay
        />
      ) : null}
    </View>
  )
}

function PodChoice({ pod, now, checked, onPress }: { pod: PodSummary; now: Date; checked: boolean; onPress: () => void }) {
  const w = podWindow(pod, now)
  const [status, color] = pod.meContributedToday
    ? ['Already snapped today', colors.leaf.DEFAULT]
    : w.status === 'open'
      ? [`On time ⚡ ${w.closesInMin}m left`, colors.flame.DEFAULT]
      : w.status === 'upcoming'
        ? [`Window opens ${formatSnapTime(pod.snapTime)} — won't count yet`, colors.ink.subtle]
        : ["Late — won't count for the tree", colors.ink.subtle]
  return (
    <ListRow
      title={pod.name}
      detail={<Text variant="subhead" style={{ color }}>{status}</Text>}
      trailing={<Icon name={checked ? 'checkCircle' : 'circle'} size={24} color={checked ? colors.leaf.DEFAULT : colors.ink.subtle} />}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${pod.name}. ${status}`}
    />
  )
}
