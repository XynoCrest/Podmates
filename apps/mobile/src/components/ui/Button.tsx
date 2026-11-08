import { colors } from '@podmates/ui-tokens'
import { ActivityIndicator, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const STYLE: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.leaf.DEFAULT, fg: colors.ink.inverse },
  secondary: { bg: colors.raised, fg: colors.ink.DEFAULT },
  outline: { bg: 'transparent', fg: colors.ink.DEFAULT, border: colors.lineStrong },
  ghost: { bg: 'transparent', fg: colors.leaf.DEFAULT },
  danger: { bg: colors.danger.soft, fg: colors.danger.DEFAULT },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  loading,
  disabled,
  flex,
  pill,
  size = 'md',
}: {
  label: string
  onPress?: () => void
  variant?: Variant
  icon?: IconName
  trailingIcon?: IconName
  loading?: boolean
  disabled?: boolean
  flex?: boolean
  /** Fully rounded ends (the PDF's "Pick snaps", "Joined", "Done"). */
  pill?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const s = STYLE[variant]
  const height = size === 'sm' ? 38 : size === 'lg' ? 56 : 46
  const iconSize = size === 'sm' ? 15 : 18
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} flex={flex} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          height,
          borderRadius: pill ? height / 2 : size === 'lg' ? 14 : 12,
          backgroundColor: s.bg,
          borderWidth: s.border ? 1 : 0,
          borderColor: s.border,
          paddingHorizontal: size === 'sm' ? 18 : 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {loading ? <ActivityIndicator color={s.fg} /> : icon ? <Icon name={icon} size={iconSize} color={s.fg} weight="semibold" /> : null}
        <Text style={{ color: s.fg, fontSize: size === 'sm' ? 15 : size === 'lg' ? 19 : 16, fontWeight: '700' }}>{label}</Text>
        {trailingIcon && !loading ? <Icon name={trailingIcon} size={iconSize + 2} color={s.fg} weight="semibold" /> : null}
      </View>
    </PressableScale>
  )
}

/**
 * The tree screen's big call to action: a solid slab with a darker "lip" under
 * it that the face presses down into — tactile, game-like, readable at a glance.
 */
export function ChunkyButton({
  label,
  onPress,
  color = colors.leaf.DEFAULT,
  lip = colors.leaf.deep,
  textColor = colors.ink.inverse,
  disabled,
  loading,
}: {
  label: string
  onPress?: () => void
  color?: string
  lip?: string
  textColor?: string
  disabled?: boolean
  loading?: boolean
}) {
  const LIP = 4
  const face = disabled ? colors.raised : color
  const edge = disabled ? colors.sunken : lip
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={{ borderRadius: 14, backgroundColor: edge, paddingBottom: LIP }}>
          <Animated.View
            style={{
              height: 56,
              borderRadius: 14,
              backgroundColor: face,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateY: pressed && !disabled ? LIP - 1 : 0 }],
              transitionProperty: 'transform',
              transitionDuration: 90,
            }}
          >
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <Text style={{ color: disabled ? colors.ink.subtle : textColor, fontSize: 18, fontWeight: '700' }}>{label}</Text>
            )}
          </Animated.View>
        </View>
      )}
    </Pressable>
  )
}
