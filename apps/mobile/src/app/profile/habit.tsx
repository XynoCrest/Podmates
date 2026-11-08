import { colors, space } from '@podmates/ui-tokens'
import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Icon, ScreenState, SheetScreen, SymbolIcon, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { MonthCalendar } from '@/features/profile/components/MonthCalendar'
import { useHabitCards } from '@/features/profile/hooks'

/** Bottom sheet from a habit card on my profile: that habit's streak, best, and month calendar. */
export default function HabitCalendarSheet() {
  const { habit } = useLocalSearchParams<{ habit: string }>()
  const cards = useHabitCards(useMe())
  const card = cards.data.find((c) => c.habit.id === habit)
  if (!card) return <ScreenState fill loading />

  return (
    <SheetScreen
      title={card.habit.name}
      leading={
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
          <SymbolIcon name={card.habit.sf_symbol} size={22} color={colors.ink.DEFAULT} />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: -space.md }}>
        <Icon name="flame" size={13} color={colors.flame.DEFAULT} />
        <Text variant="subhead" numeric>
          {card.streak ?? 0}-day streak · best {card.best ?? 0}
        </Text>
      </View>
      {habit ? <MonthCalendar habitId={habit} /> : null}
    </SheetScreen>
  )
}
