import { colors } from '@podmates/ui-tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, View } from 'react-native'
import { Icon, PressableScale, SlideIndicator, SymbolIcon, Text, useOptionLayouts } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import type { Habit } from '../hooks'

/** Side margin of the tab strip, and the width of the fade that covers it. */
const EDGE = 20
const FADE = 'rgba(11, 12, 15, 0)'

/**
 * Top tabs: one per habit, its symbol beside its name. One underline slides to the selected tab.
 * A dot marks habits with a window open for me. A trailing "+" starts or joins a pod.
 */
export function HabitTabs({
  habits,
  selected,
  onSelect,
  due,
  onAdd,
}: {
  habits: Habit[]
  selected: string | undefined
  onSelect: (id: string) => void
  due: Set<string>
  onAdd?: () => void
}) {
  const { layouts, onLayoutFor } = useOptionLayouts<string>()
  return (
    <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: EDGE, gap: 2, alignItems: 'center' }}>
        {habits.map((h) => {
          const active = h.id === selected
          const tint = active ? colors.ink.DEFAULT : colors.ink.subtle
          return (
            <PressableScale
              key={h.id}
              onLayout={onLayoutFor(h.id)}
              onPress={() => {
                if (!active) haptics.select()
                onSelect(h.id)
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={h.name}
              scaleTo={1}
            >
              <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <SymbolIcon name={h.sf_symbol} size={22} color={active ? colors.leaf.DEFAULT : colors.ink.subtle} />
                  <Text style={{ fontSize: 19, lineHeight: 24, fontWeight: active ? '700' : '500', letterSpacing: -0.3, color: tint }}>{h.name}</Text>
                  {due.has(h.id) ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.flame.DEFAULT }} /> : null}
                </View>
              </View>
            </PressableScale>
          )
        })}
        <SlideIndicator at={selected ? layouts[selected] : undefined} inset={8} style={{ bottom: 0, height: 3, borderRadius: 2, backgroundColor: colors.ink.DEFAULT }} />
        {onAdd ? (
          <PressableScale onPress={onAdd} accessibilityLabel="New or join a pod" scaleTo={0.9}>
            <View style={{ marginLeft: 4, marginBottom: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={16} color={colors.ink.DEFAULT} weight="semibold" />
            </View>
          </PressableScale>
        ) : null}
      </ScrollView>
      {/* Edge fades: tabs keep a margin from the screen edge at rest, and slide under a soft bar when scrolled. */}
      <LinearGradient pointerEvents="none" colors={[colors.canvas, FADE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 1, width: EDGE }} />
      <LinearGradient pointerEvents="none" colors={[FADE, colors.canvas]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 1, width: EDGE }} />
    </View>
  )
}
