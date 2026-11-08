import { colors } from '@podmates/ui-tokens'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, SymbolIcon, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { MonthCalendar } from '@/features/profile/components/MonthCalendar'
import { useHabitCards } from '@/features/profile/hooks'

/** Bottom sheet from a habit card on my profile: that habit's streak, best, and month calendar. */
export default function HabitCalendarSheet() {
  const { habit } = useLocalSearchParams<{ habit: string }>()
  const insets = useSafeAreaInsets()
  const cards = useHabitCards(useMe())
  const card = cards.data.find((c) => c.habit.id === habit)

  // The ScrollView must be the sheet's root: react-native-screens' formSheet doesn't lay out a nested one.
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
          {card ? <SymbolIcon name={card.habit.sf_symbol} size={22} color={colors.ink.DEFAULT} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="title">{card?.habit.name ?? ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="flame" size={13} color={colors.flame.DEFAULT} />
            <Text numeric style={{ fontSize: 15, color: colors.ink.muted }}>
              {card?.streak ?? 0}-day streak · best {card?.best ?? 0}
            </Text>
          </View>
        </View>
      </View>
      {habit ? <MonthCalendar habitId={habit} /> : null}
    </ScrollView>
  )
}
