import { colors, radii } from '@podmates/ui-tokens'
import { TextInput, View } from 'react-native'
import { Icon, PressableScale, SlideIndicator, Text, useOptionLayouts } from '@/components/ui'
import { haptics } from '@/lib/haptics'

/** Rounded search field. */
export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (text: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 16, borderRadius: radii.chip, backgroundColor: colors.canvas }}>
      <Icon name="explore" size={17} color={colors.ink.muted} weight="semibold" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ink.muted}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{ flex: 1, height: 44, fontSize: 16, color: colors.ink.DEFAULT }}
      />
    </View>
  )
}

/** Evenly spaced text tabs with a sliding underline, the same size and height as the home screen's habit tabs. */
export function UnderlineTabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string }[]; value: K; onChange: (key: K) => void }) {
  const { layouts, onLayoutFor } = useOptionLayouts<K>()
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <PressableScale
            key={t.key}
            onLayout={onLayoutFor(t.key)}
            onPress={() => {
              if (!active) haptics.select()
              onChange(t.key)
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            scaleTo={1}
            flex
          >
            <Text center style={{ paddingTop: 10, paddingBottom: 14, fontSize: 19, lineHeight: 24, fontWeight: active ? '700' : '500', letterSpacing: -0.3, color: active ? colors.ink.DEFAULT : colors.ink.subtle }}>
              {t.label}
            </Text>
          </PressableScale>
        )
      })}
      <SlideIndicator at={layouts[value]} inset={8} style={{ bottom: 0, height: 3, borderRadius: 2, backgroundColor: colors.ink.DEFAULT }} />
    </View>
  )
}
