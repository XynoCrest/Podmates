import { formatSnapTime } from '@podmates/shared'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, TextInput, View } from 'react-native'
import { Button, Icon, PressableScale, Text } from '@/components/ui'
import { HabitCarousel } from '@/features/pods/components/HabitCarousel'
import { useCreatePod, useHabits, useJoinPod } from '@/features/pods/hooks'
import { deviceTimeZone } from '@/lib/format'
import { haptics } from '@/lib/haptics'

const WINDOWS = [15, 20, 30]

/** Start a pod (habit · goal · daily snap time) or join one with an invite code. */
export default function NewPod() {
  const params = useLocalSearchParams<{ tab?: string; habit?: string }>()
  const [tab, setTab] = useState<'create' | 'join'>(params.tab === 'join' ? 'join' : 'create')
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', backgroundColor: colors.raised, borderRadius: 12, padding: 3 }}>
        {(['create', 'join'] as const).map((t) => (
          <PressableScale key={t} flex onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} scaleTo={0.97}>
            <View style={{ height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === t ? colors.line : 'transparent' }}>
              <Text style={{ fontWeight: '600', fontSize: 14 }}>{t === 'create' ? 'Start a pod' : 'Join with code'}</Text>
            </View>
          </PressableScale>
        ))}
      </View>
      {tab === 'create' ? <CreateForm initialHabit={params.habit} /> : <JoinForm />}
    </ScrollView>
  )
}

function CreateForm({ initialHabit }: { initialHabit?: string }) {
  const habits = useHabits()
  const create = useCreatePod()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [habitId, setHabitId] = useState<string>(initialHabit ?? 'reading')
  const [minutes, setMinutes] = useState(21 * 60)
  const [windowMinutes, setWindowMinutes] = useState(20)

  // Windows can't cross midnight.
  const step = (delta: number) => setMinutes((m) => Math.min(24 * 60 - windowMinutes - 15, Math.max(0, m + delta)))
  const snapTime = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

  const submit = () =>
    create.mutate(
      { name: name.trim(), habitId, goal: goal.trim(), snapTime, timeZone: deviceTimeZone(), windowMinutes },
      {
        onSuccess: (id) => {
          haptics.success()
          router.back()
          router.push({ pathname: '/pod/[id]', params: { id } })
        },
        onError: () => haptics.error(),
      },
    )

  return (
    <View style={{ gap: 20 }}>
      <Field label="Pod name" value={name} onChangeText={setName} placeholder="Atomic Habits Club" maxLength={40} />
      <View style={{ gap: 8 }}>
        <Text variant="overline">Habit</Text>
        {/* Full-bleed: the carousel band runs edge to edge of the sheet. */}
        <View style={{ marginHorizontal: -20 }}>
          <HabitCarousel habits={habits.data ?? []} value={habitId} onChange={setHabitId} />
        </View>
      </View>
      <Field label="Daily goal" value={goal} onChangeText={setGoal} placeholder="20 pages a day" maxLength={120} />
      <View style={{ gap: 8 }}>
        <Text variant="overline">Daily snap time</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.raised, borderRadius: 14, padding: 8 }}>
          <Stepper icon="arrowDown" label="Earlier" onPress={() => step(-15)} />
          <View style={{ alignItems: 'center' }}>
            <Text numeric style={{ fontSize: 28, fontWeight: '600' }}>
              {formatSnapTime(snapTime)}
            </Text>
            <Text variant="caption">{deviceTimeZone()}</Text>
          </View>
          <Stepper icon="arrowUp" label="Later" onPress={() => step(15)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {WINDOWS.map((w) => (
            <PressableScale key={w} flex onPress={() => setWindowMinutes(w)} accessibilityRole="radio" accessibilityState={{ selected: w === windowMinutes }}>
              <View style={{ height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: w === windowMinutes ? colors.flame.soft : colors.raised, borderWidth: 1, borderColor: w === windowMinutes ? colors.flame.DEFAULT : 'transparent' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: w === windowMinutes ? colors.flame.DEFAULT : colors.ink.DEFAULT }}>{w} min window</Text>
              </View>
            </PressableScale>
          ))}
        </View>
        <Text variant="caption">Everyone gets a reminder at this time and has {windowMinutes} minutes to snap proof.</Text>
      </View>
      {create.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {create.error.message}
        </Text>
      ) : null}
      <Button label="Plant the seed 🌱" size="lg" disabled={!name.trim()} loading={create.isPending} onPress={submit} />
    </View>
  )
}

function JoinForm() {
  const join = useJoinPod()
  const [code, setCode] = useState('')
  const submit = () =>
    join.mutate(code, {
      onSuccess: (id) => {
        haptics.success()
        router.back()
        router.push({ pathname: '/pod/[id]', params: { id } })
      },
      onError: () => haptics.error(),
    })
  return (
    <View style={{ gap: 14 }}>
      <Text variant="subhead">Ask a podmate for their 6-letter invite code. (Demo: try IRONPT as Ben.)</Text>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={6}
        autoCapitalize="characters"
        placeholder="ABC123"
        placeholderTextColor={colors.ink.subtle}
        style={{ height: 64, borderRadius: 14, backgroundColor: colors.raised, textAlign: 'center', fontSize: 30, fontWeight: '600', letterSpacing: 8, color: colors.ink.DEFAULT }}
      />
      {join.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {join.error.message}
        </Text>
      ) : null}
      <Button label="Join pod" size="lg" disabled={code.length !== 6} loading={join.isPending} onPress={submit} />
    </View>
  )
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="overline">{label}</Text>
      <TextInput placeholderTextColor={colors.ink.subtle} {...props} style={{ height: 46, borderRadius: 12, backgroundColor: colors.raised, paddingHorizontal: 14, color: colors.ink.DEFAULT, fontSize: 16 }} />
    </View>
  )
}

function Stepper({ icon, label, onPress }: { icon: 'arrowUp' | 'arrowDown'; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} scaleTo={0.9}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} weight="semibold" />
      </View>
    </PressableScale>
  )
}
