import { colors, radii } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

const LIP = 4

/**
 * The app's one surface: a 2px border with a thicker bottom lip. When pressable,
 * the face sinks into the lip on touch-down instead of scaling.
 */
export function Tile({
  children,
  onPress,
  style,
  tone = 'surface',
  accessibilityLabel,
  selected,
}: {
  children: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  tone?: 'surface' | 'raised' | 'leaf' | 'sun' | 'danger'
  accessibilityLabel?: string
  selected?: boolean
}) {
  const [bg, border] =
    tone === 'leaf'
      ? [colors.leaf.soft, colors.leaf.deep]
      : tone === 'sun'
        ? [colors.sun.soft, colors.sun.deep]
        : tone === 'danger'
          ? [colors.danger.soft, colors.danger.deep]
          : selected
            ? [colors.leaf.soft, colors.leaf.deep]
            : [tone === 'raised' ? colors.raised : colors.surface, colors.lip]
  const face = (pressed: boolean): StyleProp<ViewStyle> => [
    {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: 2,
      borderBottomWidth: pressed ? 2 : LIP,
      marginTop: pressed ? LIP - 2 : 0,
      borderRadius: radii.tile,
    },
    style,
  ]
  if (!onPress) return <View style={face(false)}>{children}</View>
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }}>
      {({ pressed }) => <View style={face(pressed)}>{children}</View>}
    </Pressable>
  )
}
