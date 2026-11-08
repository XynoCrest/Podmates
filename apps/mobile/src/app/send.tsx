import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Icon, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { useMyHabits, type MyHabit } from '@/features/pods/hooks'
import { useSendSnap } from '@/features/snaps/hooks'
import { takePendingCapture } from '@/features/snaps/pendingCapture'
import { haptics } from '@/lib/haptics'

/** After the shutter: which of my habits this snap counts for, plus a caption. Habits not done today are preselected. */
export default function SendSheet() {
  // `uri` param is only for http(s) demo links; real captures come through memory (see pendingCapture.ts).
  const params = useLocalSearchParams<{ uri?: string; podId?: string }>()
  const podId = params.podId
  const [uri] = useState(() => params.uri ?? takePendingCapture() ?? '')
  const insets = useSafeAreaInsets()
  const habits = useMyHabits()
  const send = useSendSnap()
  const [caption, setCaption] = useState('')
  const [picked, setPicked] = useState<Set<string> | null>(null)

  // Default selection: the habit we came from, else the first habit I haven't done today.
  const defaults = useMemo(() => {
    if (podId) return new Set([podId])
    const first = habits.data.find((h) => !h.today)
    return new Set(first ? [first.pod.id] : [])
  }, [podId, habits.data])
  const selected = picked ?? defaults

  const toggle = (id: string) => {
    haptics.select()
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const chosen = habits.data.filter((h) => selected.has(h.pod.id))

  async function submit() {
    if (!chosen.length) return
    try {
      const rows = await send.mutateAsync({ uri, caption: caption.trim(), pods: chosen.map((h) => h.pod) })
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Image source={{ uri }} style={{ width: 96, height: 128, borderRadius: 12, backgroundColor: colors.raised }} contentFit="cover" />
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="title">Counts for</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption…"
            placeholderTextColor={colors.ink.subtle}
            maxLength={200}
            multiline
            style={{ minHeight: 64, borderRadius: 12, backgroundColor: colors.raised, padding: 12, color: colors.ink.DEFAULT, fontSize: 15 }}
          />
        </View>
      </View>

      <View style={{ borderRadius: 16, backgroundColor: colors.raised, overflow: 'hidden' }}>
        {habits.data.map((h, i) => (
          <HabitChoice key={h.pod.id} habit={h} checked={selected.has(h.pod.id)} onPress={() => toggle(h.pod.id)} divider={i > 0} />
        ))}
      </View>
      {!habits.data.length && !habits.isLoading ? <Text variant="subhead">{"Add a habit first: your snaps count toward a habit's streak."}</Text> : null}
      {send.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {send.error.message}
        </Text>
      ) : null}
      <Button
        size="lg"
        icon="paperplane"
        label={chosen.length ? `Post to ${chosen.length} ${chosen.length === 1 ? 'pod' : 'pods'}` : 'Pick a habit'}
        disabled={!chosen.length}
        loading={send.isPending}
        onPress={submit}
      />
    </ScrollView>
  )
}

function HabitChoice({ habit, checked, onPress, divider }: { habit: MyHabit; checked: boolean; onPress: () => void; divider: boolean }) {
  const [status, color] =
    habit.today === 'snapped'
      ? ['Already counted today. This one is just for the pod', colors.ink.subtle]
      : habit.today === 'rest'
        ? ['Resting today. A snap turns it into a streak day', colors.leaf.DEFAULT]
        : [`Counts for today · streak ${habit.streak} → ${habit.streak + 1}`, colors.leaf.DEFAULT]
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={habit.habit.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: divider ? 0.5 : 0, borderTopColor: colors.line }}>
        <SymbolIcon name={habit.habit.sf_symbol} size={20} color={colors.ink.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{habit.habit.name}</Text>
          <Text style={{ fontSize: 13, color, marginTop: 2 }}>{status}</Text>
        </View>
        <Icon name={checked ? 'checkCircle' : 'circle'} size={24} color={checked ? colors.leaf.DEFAULT : colors.ink.subtle} />
      </View>
    </PressableScale>
  )
}
