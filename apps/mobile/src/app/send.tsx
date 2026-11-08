import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Icon, inputText, PlantLabel, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { podStatus } from '@/features/pods/components/PodRow'
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
  const insets = useSafeAreaInsets()
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
    const out: { habit: string; symbol: string; pods: PodSummary[] }[] = []
    for (const h of habits.data ?? []) {
      const list = pods.data?.filter((p) => p.habitId === h.id && p.treeStatus === 'alive') ?? []
      if (list.length) out.push({ habit: h.name, symbol: h.sf_symbol, pods: list })
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
    // The ScrollView must be the sheet's root: react-native-screens' formSheet doesn't lay out a nested one.
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Image source={{ uri }} style={{ width: 96, height: 128, borderRadius: 12, backgroundColor: colors.raised }} contentFit="cover" />
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="title">Send to</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption…"
              placeholderTextColor={colors.ink.subtle}
              maxLength={200}
              multiline
              style={[inputText, { minHeight: 64, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.canvas, padding: 12, fontSize: 15 }]}
            />
          </View>
        </View>

        {grouped.map((g) => (
          <View key={g.habit} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SymbolIcon name={g.symbol} size={14} color={colors.ink.subtle} />
              <Text variant="label">{g.habit}</Text>
            </View>
            <View style={{ borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.lip, backgroundColor: colors.canvas, overflow: 'hidden' }}>
              {g.pods.map((p, i) => (
                <PodChoice key={p.id} pod={p} now={now} checked={selected.has(p.id)} onPress={() => toggle(p.id)} divider={i > 0} />
              ))}
            </View>
          </View>
        ))}
        {send.error ? (
          <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
            {send.error.message}
          </Text>
        ) : null}
      <Button
        size="lg"
        icon="paperplane"
        label={chosen.length ? `Send to ${chosen.length} ${chosen.length === 1 ? 'pod' : 'pods'}` : 'Pick a pod'}
        disabled={!chosen.length}
        loading={send.isPending}
        onPress={submit}
      />
    </ScrollView>
  )
}

function PodChoice({ pod, now, checked, onPress, divider }: { pod: PodSummary; now: Date; checked: boolean; onPress: () => void; divider: boolean }) {
  const status = podStatus(pod, now)
  // What sending here would do, in plain words.
  const effect = pod.meContributedToday ? 'Already counted today' : status.tone === 'open' ? 'Counts for the tree' : "Won't count for the tree"
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={pod.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="headline">{pod.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PlantLabel tone={status.tone} label={status.label} />
            <Text variant="caption">{effect}</Text>
          </View>
        </View>
        <Icon name={checked ? 'checkCircle' : 'circle'} size={24} color={checked ? colors.leaf.DEFAULT : colors.ink.subtle} />
      </View>
    </PressableScale>
  )
}
