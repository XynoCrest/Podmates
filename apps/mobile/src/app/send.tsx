import { formatSnapTime } from '@podmates/shared'
import { colors, radii, space } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Button, Icon, ListRow, Section, SheetScreen, Text, TextField } from '@/components/ui'
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

  // Default selection: the pod we came from, else every pod with an open window I haven't snapped for.
  const defaults = useMemo(() => {
    if (podId) return new Set([podId])
    return new Set(pods.data?.filter((p) => !p.meContributedToday && podWindow(p, now).status === 'open').map((p) => p.id))
  }, [podId, pods.data, now])
  const selected = picked ?? defaults

  const grouped = useMemo(() => {
    const out: { habit: string; pods: PodSummary[] }[] = []
    for (const h of habits.data ?? []) {
      const list = pods.data?.filter((p) => p.habitId === h.id && p.treeStatus === 'alive') ?? []
      if (list.length) out.push({ habit: h.name, pods: list })
    }
    return out
  }, [habits.data, pods.data])

  const toggle = (id: string) => {
    haptics.select()
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const chosen = pods.data?.filter((p) => selected.has(p.id)) ?? []

  async function submit() {
    if (!chosen.length) return
    try {
      const rows = await send.mutateAsync({ uri, caption: caption.trim(), pods: chosen })
      haptics.success()
      router.dismissAll()
      if (rows.length === 1) router.push({ pathname: '/pod/[id]', params: { id: rows[0]!.pod_id } })
      else router.navigate('/')
    } catch {
      haptics.error()
    }
  }

  return (
    <SheetScreen
      title="Send to"
      subtitle="Pods with an open window are picked for you."
      error={send.error?.message}
      action={
        <Button
          size="lg"
          icon="paperplane"
          label={chosen.length ? `Send to ${chosen.length} ${chosen.length === 1 ? 'pod' : 'pods'}` : 'Pick a pod'}
          disabled={!chosen.length}
          loading={send.isPending}
          onPress={submit}
        />
      }
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Image source={{ uri }} style={{ width: 96, height: 128, borderRadius: radii.card, backgroundColor: colors.raised }} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <TextField value={caption} onChangeText={setCaption} placeholder="Add a caption…" maxLength={200} multiline style={{ minHeight: 128 }} />
        </View>
      </View>

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
