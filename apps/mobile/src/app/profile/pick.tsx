import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Dimensions, ScrollView, View } from 'react-native'
import { LineIcon, PressableScale, SheetHeader, Text } from '@/components/ui'
import { useHabits } from '@/features/pods/hooks'
import { useMySnaps, useToggleOnProfile } from '@/features/snaps/hooks'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'

const PAD = 16
const GAP = 10
const W = (Dimensions.get('window').width - PAD * 2 - GAP * 2) / 3

/**
 * Pick which of my past snaps show on my profile for this habit. Choices are local
 * until Done, so Cancel really cancels; Done saves only what changed.
 */
export default function PickSnaps() {
  const { habit } = useLocalSearchParams<{ habit: string }>()
  const habits = useHabits()
  const snaps = useMySnaps(habit)
  const toggle = useToggleOnProfile(habit)
  const [chosen, setChosen] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)
  const name = habits.data?.find((h) => h.id === habit)?.name ?? ''

  const list = snaps.data ?? []
  const selected = chosen ?? new Set(list.filter((s) => s.onProfile).map((s) => s.id))

  const flip = (id: string) => {
    haptics.select()
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChosen(next)
  }

  async function done() {
    const changed = list.filter((s) => s.onProfile !== selected.has(s.id))
    setSaving(true)
    try {
      await Promise.all(changed.map((s) => toggle.mutateAsync({ snapId: s.id, onProfile: selected.has(s.id) })))
      if (changed.length) haptics.success()
      router.back()
    } catch {
      haptics.error()
    } finally {
      setSaving(false)
    }
  }

  // The ScrollView is the sheet's root: react-native-screens' formSheet doesn't lay out a nested one (docs/INVARIANTS.md #7).
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[0]}>
      <SheetHeader title="Pick snaps" subtitle={`${selected.size} of ${list.length} chosen`} onCancel={() => router.back()} action="Done" onAction={done} actionLoading={saving} />
      <Text style={{ paddingHorizontal: PAD, paddingVertical: 16, fontSize: 16, lineHeight: 23, color: colors.ink.muted }}>
        These show on your {name} tab. Everything else stays private to the pod that received it.
      </Text>
      {toggle.error ? <Text style={{ paddingHorizontal: PAD, paddingBottom: 12, color: colors.danger.DEFAULT }}>{toggle.error.message}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD }}>
        {list.map((item) => {
          const on = selected.has(item.id)
          return (
            <PressableScale key={item.id} onPress={() => flip(item.id)} scaleTo={0.96} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel="Snap">
              <View style={{ width: W, height: W * (4 / 3), borderRadius: 12, overflow: 'hidden', borderWidth: on ? 3 : 0, borderColor: colors.leaf.DEFAULT, backgroundColor: colors.raised }}>
                <Image source={{ uri: imageUri(item.image) }} style={{ flex: 1 }} contentFit="cover" recyclingKey={item.id} />
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  {on ? (
                    <View style={{ borderRadius: 16, backgroundColor: colors.surface }}>
                      <LineIcon name="checkedBadge" size={30} color={colors.leaf.DEFAULT} />
                    </View>
                  ) : (
                    <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: '#fff', backgroundColor: 'rgba(0,0,0,0.12)' }} />
                  )}
                </View>
              </View>
            </PressableScale>
          )
        })}
      </View>
      {!snaps.isLoading && !list.length ? <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>No snaps for this habit yet.</Text> : null}
    </ScrollView>
  )
}
