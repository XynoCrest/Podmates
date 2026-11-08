import { formatSnapTime } from '@podmates/shared'
import { colors, radii, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button, Icon, PressableScale, Section, Segmented, SheetScreen, Text, TextField } from '@/components/ui'
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
    <SheetScreen
      title={tab === 'create' ? 'Start a pod' : 'Join a pod'}
      subtitle={tab === 'create' ? 'Pick a habit and a daily snap time, then invite friends.' : 'Ask a podmate for their 6-letter invite code.'}
    >
      <Segmented
        value={tab}
        onChange={setTab}
        segments={[
          { key: 'create', label: 'Start a pod' },
          { key: 'join', label: 'Join with code' },
        ]}
      />
      {tab === 'create' ? <CreateForm initialHabit={params.habit} /> : <JoinForm />}
    </SheetScreen>
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
    <View style={{ gap: space.xl }}>
      <TextField label="Pod name" value={name} onChangeText={setName} placeholder="Atomic Habits Club" maxLength={40} />
      <Section label="Habit">
        {/* Full-bleed: the carousel band runs edge to edge of the sheet. */}
        <View style={{ marginHorizontal: -space.gutter }}>
          <HabitCarousel habits={habits.data ?? []} value={habitId} onChange={setHabitId} />
        </View>
      </Section>
      <TextField label="Daily goal" value={goal} onChangeText={setGoal} placeholder="20 pages a day" maxLength={120} />
      <Section label="Daily snap time">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.raised, borderRadius: radii.card, padding: space.sm }}>
          <Stepper icon="arrowDown" label="Earlier" onPress={() => step(-15)} />
          <View style={{ alignItems: 'center' }}>
            <Text variant="title" numeric>
              {formatSnapTime(snapTime)}
            </Text>
            <Text variant="caption">{deviceTimeZone()}</Text>
          </View>
          <Stepper icon="arrowUp" label="Later" onPress={() => step(15)} />
        </View>
        <Segmented
          value={String(windowMinutes)}
          onChange={(v) => setWindowMinutes(Number(v))}
          segments={WINDOWS.map((w) => ({ key: String(w), label: `${w} min` }))}
        />
        <Text variant="caption">Everyone gets a reminder at this time and has {windowMinutes} minutes to snap proof.</Text>
      </Section>
      <FormAction error={create.error?.message}>
        <Button label="Plant the seed 🌱" size="lg" disabled={!name.trim()} loading={create.isPending} onPress={submit} />
      </FormAction>
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
    <View style={{ gap: space.xl }}>
      <TextField
        label="Invite code"
        hint="Demo: try IRONPT as Ben."
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={6}
        autoCapitalize="characters"
        placeholder="ABC123"
        style={{ height: 64, textAlign: 'center', fontSize: 30, fontWeight: '600', letterSpacing: 8 }}
      />
      <FormAction error={join.error?.message}>
        <Button label="Join pod" size="lg" disabled={code.length !== 6} loading={join.isPending} onPress={submit} />
      </FormAction>
    </View>
  )
}

/** The sheet's main button at the end of the content, with its error under it (as SheetScreen's `action`). */
function FormAction({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      {children}
      {error ? (
        <Text variant="caption" center style={{ color: colors.danger.DEFAULT }}>
          {error}
        </Text>
      ) : null}
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
