import { formatSnapTime } from '@podmates/shared'
import { RULES } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, HeaderAction, Icon, IconButton, PressableScale, SectionLabel, Text } from '@/components/ui'
import { PodAvatar } from '@/features/pods/components/PodAvatar'
import { podWindow, useHabits, useMyPods, type PodSummary } from '@/features/pods/hooks'
import { useSendSnap } from '@/features/snaps/hooks'
import { takePendingCapture } from '@/features/snaps/pendingCapture'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'
import { useNow } from '@/lib/useNow'

/** After the shutter: what this snap counts for, an optional caption, and which pods get it. Open windows are preselected. */
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
  const habitName = (id: string) => habits.data?.find((h) => h.id === id)?.name ?? ''

  const alive = useMemo(() => {
    const order = new Map(habits.data?.map((h) => [h.id, h.sort]))
    return (pods.data ?? []).filter((p) => p.treeStatus === 'alive').sort((a, b) => (order.get(a.habitId) ?? 0) - (order.get(b.habitId) ?? 0))
  }, [habits.data, pods.data])

  const toggle = (id: string) => {
    haptics.select()
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const chosen = pods.data?.filter((p) => selected.has(p.id)) ?? []
  // The summary describes the first chosen pod (usually the one whose window brought you here).
  const lead = chosen[0]
  const leadWindow = lead ? podWindow(lead, now) : null

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10 }}>
        <IconButton icon="back" label="Back" onPress={goBack} />
        <Text style={{ flex: 1, fontSize: 21, fontWeight: '700' }}>Send to</Text>
        <HeaderAction label="Retake" onPress={goBack} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 20, paddingTop: 8 }}>
        <Image source={{ uri }} style={{ width: 112, height: 150, borderRadius: 14, backgroundColor: colors.raised }} contentFit="cover" />
        <View style={{ flex: 1, gap: 6 }}>
          {lead && leadWindow ? (
            <>
              <Text style={{ fontSize: 19, fontWeight: '700' }}>{habitName(lead.habitId)}</Text>
              {lead.meContributedToday ? (
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.leaf.DEFAULT }}>Already counted today</Text>
              ) : leadWindow.status === 'open' ? (
                <>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.leaf.DEFAULT }}>On time · {leadWindow.closesInMin} min before close</Text>
                  <Text style={{ fontSize: 16, color: colors.ink.muted }}>Earns ⚡{RULES.energyPerCheckin} and +1 streak</Text>
                </>
              ) : (
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.flame.deep }}>
                  {leadWindow.status === 'upcoming' ? `Window opens ${formatSnapTime(lead.snapTime)}. Won't count yet` : "Late. Won't count for the tree"}
                </Text>
              )}
            </>
          ) : (
            <Text style={{ fontSize: 17, color: colors.ink.muted }}>Pick the pods that get this snap.</Text>
          )}
        </View>
      </View>

      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Add a caption (optional)"
        placeholderTextColor={colors.ink.subtle}
        maxLength={200}
        multiline
        style={{ marginHorizontal: 20, marginTop: 20, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, color: colors.ink.DEFAULT, fontSize: 17 }}
      />

      <SectionLabel style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 6 }}>Your pods</SectionLabel>
      {alive.map((p) => (
        <PodChoice key={p.id} pod={p} habit={habitName(p.habitId)} now={now} checked={selected.has(p.id)} onPress={() => toggle(p.id)} />
      ))}

      {send.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT, paddingHorizontal: 20 }}>
          {send.error.message}
        </Text>
      ) : null}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Button size="lg" trailingIcon="arrowRight" label={chosen.length ? `Send to ${chosen.length}` : 'Pick a pod'} disabled={!chosen.length} loading={send.isPending} onPress={submit} />
      </View>
    </ScrollView>
  )
}

function PodChoice({ pod, habit, now, checked, onPress }: { pod: PodSummary; habit: string; now: Date; checked: boolean; onPress: () => void }) {
  const w = podWindow(pod, now)
  // Only call out pods where this snap wouldn't count.
  const note = pod.meContributedToday ? 'Already snapped today' : w.status === 'open' ? null : w.status === 'upcoming' ? `Opens ${formatSnapTime(pod.snapTime)}` : 'Late'
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={pod.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 10 }}>
        <PodAvatar growth={pod.growth} hp={pod.hp} maxHp={pod.maxHp} size={64} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 19, fontWeight: '600' }}>
            {pod.name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 16, color: colors.ink.muted, marginTop: 2 }}>
            {habit} · {pod.memberCount} members
            {note ? <Text style={{ fontSize: 16, color: colors.flame.deep }}> · {note}</Text> : null}
          </Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 6, borderWidth: checked ? 0 : 1.5, borderColor: colors.lineStrong, backgroundColor: checked ? colors.leaf.DEFAULT : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          {checked ? <Icon name="check" size={22} color={colors.ink.inverse} /> : null}
        </View>
      </View>
    </PressableScale>
  )
}
