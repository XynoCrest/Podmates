import { colors } from '@podmates/ui-tokens'
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native'

// Size-specific tracking: large type tightens, small type opens up slightly (Apple's tracking tables).
const VARIANTS = StyleSheet.create({
  display: { fontSize: 34, lineHeight: 40, fontWeight: '600', letterSpacing: -0.6, color: colors.ink.DEFAULT },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4, color: colors.ink.DEFAULT },
  headline: { fontSize: 19, lineHeight: 24, fontWeight: '600', color: colors.ink.DEFAULT },
  body: { fontSize: 16, lineHeight: 22, color: colors.ink.DEFAULT },
  callout: { fontSize: 15, lineHeight: 20, color: colors.ink.DEFAULT },
  // Row titles, field labels, small bold names: body size, semibold.
  label: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: colors.ink.DEFAULT },
  subhead: { fontSize: 14, lineHeight: 19, color: colors.ink.muted },
  caption: { fontSize: 12, lineHeight: 16, color: colors.ink.muted },
  // Section label: sentence case, quiet. Sits closer to its own items than to the section above.
  overline: { fontSize: 13, lineHeight: 16, fontWeight: '500', color: colors.ink.muted },
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
