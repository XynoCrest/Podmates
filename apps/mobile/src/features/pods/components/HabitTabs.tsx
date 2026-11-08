import { colors } from '@podmates/ui-tokens'
import { ScrollView, View } from 'react-native'
import { PressableScale, Text } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import type { Habit } from '../hooks'

/** Top tabs: one per habit, underlined when selected. A dot marks habits with a window open for me. */
export function HabitTabs({ habits, selected, onSelect, due }: { habits: Habit[]; selected: string | undefined; onSelect: (id: string) => void; due: Set<string> }) {
  return (
    <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
        {habits.map((h) => {
          const active = h.id === selected
          return (
            <PressableScale
              key={h.id}
              onPress={() => {
                if (!active) haptics.select()
                onSelect(h.id)
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              scaleTo={0.94}
            >
              <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontSize: 15, fontWeight: active ? '700' : '500', color: active ? colors.ink.DEFAULT : colors.ink.subtle }}>{h.name}</Text>
                  {due.has(h.id) ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.flame.DEFAULT }} /> : null}
                </View>
                <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 2.5, borderRadius: 2, backgroundColor: active ? colors.ink.DEFAULT : 'transparent' }} />
              </View>
            </PressableScale>
          )
        })}
      </ScrollView>
    </View>
  )
}
