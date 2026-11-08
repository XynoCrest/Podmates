import { formatSnapTime } from '@podmates/shared'
import { colors } from '@podmates/ui-tokens'
import { Alert, ScrollView, View } from 'react-native'
import { Button, Icon, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { useAddHabit, useHabits, useMyHabits, usePods, useRemoveHabit, useSetReminder, type MyHabit } from '@/features/pods/hooks'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'

/**
 * Your habits: pick from the fixed list. Adding a habit joins its pod; removing it leaves the pod
 * (your history stays, the streak goes). Tracked habits can have an optional daily reminder.
 */
export default function HabitsSheet() {
  const habits = useHabits()
  const pods = usePods()
  const mine = useMyHabits()
  const add = useAddHabit()
  const remove = useRemoveHabit()

  const tracked = new Map(mine.data.map((h) => [h.habit.id, h]))

  const confirmRemove = (h: MyHabit) =>
    Alert.alert(`Remove ${h.habit.name}?`, `You'll leave the ${h.habit.name} pod and lose your ${h.streak}-day streak. Your snaps stay.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(h.habit.id, { onSuccess: () => haptics.tap() }) },
    ])

  // The ScrollView must be the sheet's root: react-native-screens' formSheet doesn't lay out a nested one.
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text variant="title">Your habits</Text>
        <Text variant="subhead">Each habit has a pod of people building it too. Snap once a day, any time, to keep your streak.</Text>
      </View>
      {habits.data?.map((habit) => {
        const mineH = tracked.get(habit.id)
        const pod = pods.data?.find((p) => p.habitId === habit.id)
        return (
          <View key={habit.id} style={{ borderRadius: 14, backgroundColor: colors.raised, padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <SymbolIcon name={habit.sf_symbol} size={20} color={mineH ? colors.leaf.DEFAULT : colors.ink.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{habit.name}</Text>
                <Text variant="caption">{pod ? `${compact(pod.memberCount)} in the pod` : ''}</Text>
              </View>
              {mineH ? (
                <Button label="Remove" variant="ghost" size="sm" onPress={() => confirmRemove(mineH)} />
              ) : (
                <Button label="Add" icon="plus" size="sm" loading={add.isPending && add.variables === habit.id} onPress={() => add.mutate(habit.id, { onSuccess: () => haptics.success() })} />
              )}
            </View>
            {mineH ? <ReminderRow habit={mineH} /> : null}
          </View>
        )
      })}
    </ScrollView>
  )
}

/** Optional daily reminder for one habit, in 30-minute steps; off by default. */
function ReminderRow({ habit }: { habit: MyHabit }) {
  const set = useSetReminder()
  const minutes = habit.reminderTime ? Number(habit.reminderTime.slice(0, 2)) * 60 + Number(habit.reminderTime.slice(3, 5)) : null
  const save = (m: number | null) => {
    haptics.select()
    set.mutate({ podId: habit.pod.id, time: m === null ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` })
  }
  const step = (delta: number) => save(((minutes ?? 19 * 60) + delta + 24 * 60) % (24 * 60))
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="clock" size={16} color={colors.ink.muted} />
      <Text style={{ flex: 1, fontSize: 14, color: colors.ink.muted }}>{minutes === null ? 'No reminder' : `Reminder at ${formatSnapTime(habit.reminderTime!)}`}</Text>
      <Stepper label="Earlier" text="−" onPress={() => step(-30)} />
      <Stepper label="Later" text="+" onPress={() => step(30)} />
      {minutes !== null ? <Stepper label="Turn off reminder" text="Off" onPress={() => save(null)} /> : null}
    </View>
  )
}

function Stepper({ label, text, onPress }: { label: string; text: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} scaleTo={0.9}>
      <View style={{ minWidth: 36, height: 32, paddingHorizontal: 8, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '600' }}>{text}</Text>
      </View>
    </PressableScale>
  )
}
