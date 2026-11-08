import { colors } from '@podmates/ui-tokens'
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native'

/**
 * Figtree, loaded in the root layout. Custom fonts pick their weight by family name,
 * so `fontWeight` is translated here; 700+ is capped at 600.
 */
export const font = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
} as const

export function fontFor(weight: TextStyle['fontWeight']): string {
  const w = typeof weight === 'number' ? weight : Number(weight === 'bold' ? 700 : weight ?? 400)
  if (w >= 600) return font.semibold
  if (w >= 500) return font.medium
  return font.regular
}

// Hierarchy from size and colour; weights stay between 400 and 600.
const VARIANTS = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '600', letterSpacing: -0.6, color: colors.ink.DEFAULT },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3, color: colors.ink.DEFAULT },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.ink.DEFAULT },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', color: colors.ink.DEFAULT },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400', color: colors.ink.DEFAULT },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: colors.ink.muted },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', color: colors.ink.subtle },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.ink.subtle },
} satisfies Record<string, TextStyle>

export type TextVariant = keyof typeof VARIANTS

export function Text({
  variant = 'body',
  numeric,
  center,
  style,
  ...props
}: TextProps & { variant?: TextVariant; numeric?: boolean; center?: boolean }) {
  const merged = StyleSheet.flatten([VARIANTS[variant], style]) as TextStyle
  // A custom fontSize without a lineHeight would inherit the variant's leading and clip glyphs.
  const flatOwn = StyleSheet.flatten(style) as TextStyle | undefined
  const lineHeight = flatOwn?.fontSize && !flatOwn.lineHeight ? Math.round(flatOwn.fontSize * 1.3) : merged.lineHeight
  return (
    <RNText
      {...props}
      style={[
        merged,
        { fontFamily: fontFor(merged.fontWeight), fontWeight: undefined, lineHeight },
        center ? { textAlign: 'center' } : null,
        // Tabular figures so counters (HP, energy, votes) don't jitter as digits change.
        numeric ? { fontVariant: ['tabular-nums'] } : null,
      ]}
    />
  )
}

/** Base style for every TextInput, so typed text uses the same family as the rest of the UI. */
export const inputText = { fontFamily: font.regular, fontSize: 16, color: colors.ink.DEFAULT } as const
