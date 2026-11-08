import { colors } from '@podmates/ui-tokens'
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native'

// Size-specific tracking: large type tightens, small type opens up slightly (Apple's tracking tables).
const VARIANTS = StyleSheet.create({
  display: { fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: colors.ink.DEFAULT },
  title: { fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6, color: colors.ink.DEFAULT },
  headline: { fontSize: 19, lineHeight: 24, fontWeight: '600', color: colors.ink.DEFAULT },
  body: { fontSize: 16, lineHeight: 22, color: colors.ink.DEFAULT },
  callout: { fontSize: 15, lineHeight: 20, color: colors.ink.DEFAULT },
  subhead: { fontSize: 14, lineHeight: 19, color: colors.ink.muted },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.3, color: colors.ink.muted },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: colors.ink.subtle },
})

export type TextVariant = keyof typeof VARIANTS

export function Text({
  variant = 'body',
  numeric,
  center,
  style,
  ...props
}: TextProps & { variant?: TextVariant; numeric?: boolean; center?: boolean }) {
  // A custom fontSize without a lineHeight would inherit the variant's (smaller) leading and clip glyphs.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined
  const leading = flat?.fontSize && !flat.lineHeight ? { lineHeight: Math.round(flat.fontSize * 1.25) } : null
  return (
    <RNText
      {...props}
      style={[
        VARIANTS[variant],
        center ? { textAlign: 'center' } : null,
        // Tabular figures so counters (HP, energy, votes) don't jitter as digits change.
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
        leading,
      ]}
    />
  )
}
