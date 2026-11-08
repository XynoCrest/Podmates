import { colors } from '@podmates/ui-tokens'
import { ScrollView, View } from 'react-native'
import { HabitIcon, Pill } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import type { Habit } from '../hooks'

/** Habit pills: solid green when selected. An amber dot marks habits with a window open for me. */
export function HabitTabs({ habits, selected, onSelect, due }: { habits: Habit[]; selected: string | undefined; onSelect: (id: string) => void; due: Set<string> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 10 }}>
      {habits.map((h) => {
        const active = h.id === selected
        return (
          <View key={h.id}>
            <Pill
              label={h.name}
              selected={active}
              icon={(color) => <HabitIcon habit={h} size={18} color={color} />}
              accessibilityLabel={due.has(h.id) ? `${h.name}, snap window open` : h.name}
              onPress={() => {
                if (!active) haptics.select()
                onSelect(h.id)
              }}
            />
            {due.has(h.id) ? <View style={{ position: 'absolute', top: 0, right: 2, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.flame.DEFAULT, borderWidth: 2, borderColor: colors.canvas }} /> : null}
          </View>
        )
      })}
    </ScrollView>
  )
}
