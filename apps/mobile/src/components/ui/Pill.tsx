import { colors } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/** Selectable rounded pill: solid green when selected, soft grey otherwise (habit tabs, Hot/New/Top). */
export function Pill({ label, selected, onPress, icon, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; icon?: (color: string) => ReactNode; accessibilityLabel?: string }) {
  const fg = selected ? colors.ink.inverse : colors.ink.muted
  return (
    <PressableScale onPress={onPress} scaleTo={0.95} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={accessibilityLabel ?? label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: selected ? colors.leaf.DEFAULT : colors.raised }}>
        {icon?.(fg)}
        <Text style={{ fontSize: 16, fontWeight: '700', color: fg }}>{label}</Text>
      </View>
    </PressableScale>
  )
}

const TONES = {
  warn: { bg: colors.flame.soft, fg: colors.flame.deep, dot: colors.flame.DEFAULT },
  good: { bg: colors.leaf.soft, fg: colors.leaf.DEFAULT, dot: colors.leaf.bright },
  bad: { bg: colors.danger.soft, fg: colors.danger.deep, dot: colors.danger.DEFAULT },
  neutral: { bg: colors.raised, fg: colors.ink.muted, dot: colors.ink.subtle },
} as const

export type StatusTone = keyof typeof TONES

/** Rounded status message with a leading dot ("4:12 left in the window", "priya has not snapped yet"). */
export function StatusPill({ tone, label, large }: { tone: StatusTone; label: string; large?: boolean }) {
  const t = TONES[tone]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', paddingHorizontal: large ? 20 : 16, paddingVertical: large ? 12 : 9, borderRadius: 999, backgroundColor: t.bg, maxWidth: '100%' }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.dot }} />
      <Text numeric numberOfLines={2} style={{ flexShrink: 1, color: t.fg, fontWeight: '700', fontSize: large ? 17 : 15 }}>
        {label}
      </Text>
    </View>
  )
}
