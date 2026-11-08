import { RULES } from '@podmates/tree-engine'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Icon, PressableScale, SymbolIcon, Text, type IconName } from '@/components/ui'
import { useAddHabit, useHabits, usePods, useSetReminder } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { qk } from '@/lib/keys'

const TOUR: { icon: IconName; title: string; body: string }[] = [
  { icon: 'flame', title: 'One snap a day', body: 'Snap your habit any time today to keep your streak. Live camera only, so it really is today.' },
  { icon: 'moon', title: `${RULES.restDaysPerWeek} rest days a week`, body: 'Sick, travelling, or just tired? Tap "Rest today" and your streak holds. Life happens.' },
  { icon: 'tree', title: 'Grow a tree together', body: 'Every habit has a pod. Its tree is as healthy as the share of members keeping their streak, and grows with every snap.' },
]

const REMINDERS: { label: string; time: string | null }[] = [
  { label: 'Off', time: null },
  { label: '7 AM', time: '07:00' },
  { label: '12 PM', time: '12:00' },
  { label: '7 PM', time: '19:00' },
]

/** First run: a three-card tour → pick habits (joins their pods) → optional reminder per habit. */
export default function Onboarding() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0) // 0–2 tour, 3 habits, 4 reminders
  const [picked, setPicked] = useState<string[]>([])
  const [times, setTimes] = useState<Record<string, string | null>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const habits = useHabits()
  const pods = usePods()
  const add = useAddHabit()
  const remind = useSetReminder()
  const queryClient = useQueryClient()

  const toggle = (id: string) => {
    haptics.select()
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      for (const id of picked) await add.mutateAsync(id)
      for (const id of picked) {
        const pod = pods.data?.find((p) => p.habitId === id)
        if (pod && times[id]) await remind.mutateAsync({ podId: pod.id, time: times[id]! })
      }
      // Home redirects back here while it thinks I track no habits, so wait for the fresh
      // list (and pods, which it is joined against) before leaving. refetchQueries also
      // refetches inactive queries, and Home's are inactive while onboarding is open.
      await Promise.all([queryClient.refetchQueries({ queryKey: qk.myHabits }), queryClient.refetchQueries({ queryKey: qk.pods })])
      haptics.success()
      router.replace('/')
    } catch (e) {
      haptics.error()
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const tour = step < TOUR.length ? TOUR[step]! : null
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 12 }} accessibilityLabel={`Step ${step + 1} of 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? colors.leaf.DEFAULT : colors.raised }} />
        ))}
      </View>

      {tour ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 }}>
          {step === 2 ? <TreeArt totalSnaps={320} health={0.9} size={180} /> : (
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={tour.icon} size={44} color={step === 0 ? colors.flame.DEFAULT : colors.sky.DEFAULT} />
            </View>
          )}
          <Text variant="title" center>
            {tour.title}
          </Text>
          <Text variant="subhead" center style={{ fontSize: 17, lineHeight: 24 }}>
            {tour.body}
          </Text>
        </View>
      ) : step === 3 ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          <Text variant="title">Pick your habits</Text>
          <Text variant="subhead" style={{ marginBottom: 6 }}>
            Choose one to three to start. You can add more later.
          </Text>
          {habits.data?.map((h) => {
            const on = picked.includes(h.id)
            const pod = pods.data?.find((p) => p.habitId === h.id)
            return (
              <PressableScale key={h.id} onPress={() => toggle(h.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={h.name}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: on ? colors.leaf.soft : colors.surface, borderWidth: 1, borderColor: on ? colors.leaf.DEFAULT : colors.line }}>
                  <SymbolIcon name={h.sf_symbol} size={22} color={on ? colors.leaf.DEFAULT : colors.ink.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{h.name}</Text>
                    {pod ? <Text variant="caption">{compact(pod.memberCount)} people in the pod</Text> : null}
                  </View>
                  <Icon name={on ? 'checkCircle' : 'circle'} size={24} color={on ? colors.leaf.DEFAULT : colors.ink.subtle} />
                </View>
              </PressableScale>
            )
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
          <Text variant="title">Reminders</Text>
          <Text variant="subhead">Optional. We also send a gentle evening nudge if a habit is still open.</Text>
          {picked.map((id) => {
            const h = habits.data?.find((x) => x.id === id)
            return (
              <View key={id} style={{ gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{h?.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {REMINDERS.map((r) => {
                    const on = (times[id] ?? null) === r.time
                    return (
                      <PressableScale key={r.label} flex onPress={() => setTimes((t) => ({ ...t, [id]: r.time }))} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${h?.name} reminder ${r.label}`}>
                        <View style={{ height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.leaf.soft : colors.surface, borderWidth: 1, borderColor: on ? colors.leaf.DEFAULT : colors.line }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: on ? colors.leaf.DEFAULT : colors.ink.DEFAULT }}>{r.label}</Text>
                        </View>
                      </PressableScale>
                    )
                  })}
                </View>
              </View>
            )
          })}
          {error ? (
            <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}>
        {step < 3 ? (
          <Button label={step === 2 ? 'Pick my habits' : 'Next'} size="lg" onPress={() => setStep(step + 1)} />
        ) : step === 3 ? (
          <Button label={picked.length ? `Continue with ${picked.length}` : 'Pick at least one'} size="lg" disabled={!picked.length} onPress={() => setStep(4)} />
        ) : (
          <Button label="Start" size="lg" loading={saving} onPress={finish} />
        )}
        {step > 0 ? <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </View>
  )
}
