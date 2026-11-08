import { colors } from '@podmates/ui-tokens'
import { ScrollView, View } from 'react-native'
import { PressableScale, SymbolIcon, Text } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import type { Habit } from '../hooks'

/** One tab per habit. A small sun dot marks habits with a snap window open for me. */
export function HabitTabs({ habits, selected, onSelect, due }: { habits: Habit[]; selected: string | undefined; onSelect: (id: string) => void; due: Set<string> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}>
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
            accessibilityLabel={h.name}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: active ? colors.leaf.deep : colors.line,
                backgroundColor: active ? colors.leaf.soft : 'transparent',
              }}
            >
              <SymbolIcon name={h.sf_symbol} size={16} color={active ? colors.leaf.DEFAULT : colors.ink.subtle} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: active ? colors.leaf.DEFAULT : colors.ink.muted }}>{h.name}</Text>
              {due.has(h.id) ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sun.DEFAULT }} /> : null}
            </View>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}
