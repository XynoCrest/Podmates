import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { haptics } from '@/lib/haptics'
import { PressableScale } from './PressableScale'
import { SlideIndicator, useOptionLayouts } from './SlideIndicator'
import { Text } from './Text'

export interface Segment<K extends string> {
  key: K
  label: string
  /** Shown as a grey count bubble when above zero. */
  badge?: number
}

/** A pill of options: the selected one sits in a darker inset pill that slides between them. */
export function Segmented<K extends string>({ segments, value, onChange }: { segments: Segment<K>[]; value: K; onChange: (key: K) => void }) {
  const { layouts, onLayoutFor } = useOptionLayouts<K>()
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', alignSelf: 'flex-start', padding: 4, gap: 2, borderRadius: 999, backgroundColor: colors.raised, borderWidth: 0.5, borderColor: colors.line }}
    >
      <SlideIndicator at={layouts[value]} style={{ top: 4, bottom: 4, borderRadius: 999, backgroundColor: colors.sunken }} />
      {segments.map((s) => {
        const active = s.key === value
        return (
          <PressableScale
            key={s.key}
            onLayout={onLayoutFor(s.key)}
            onPress={() => {
              if (!active) haptics.select()
              onChange(s.key)
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={s.badge ? `${s.label}, ${s.badge}` : s.label}
            scaleTo={1}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 999 }}>
              <Text style={{ fontSize: 15, fontWeight: active ? '600' : '500', color: active ? colors.ink.DEFAULT : colors.ink.muted }}>{s.label}</Text>
              {s.badge ? (
                <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: colors.ink.subtle, alignItems: 'center', justifyContent: 'center' }}>
                  <Text numeric style={{ fontSize: 12, lineHeight: 15, fontWeight: '600', color: colors.ink.DEFAULT }}>
                    {s.badge}
                  </Text>
                </View>
              ) : null}
            </View>
          </PressableScale>
        )
      })}
    </View>
  )
}
