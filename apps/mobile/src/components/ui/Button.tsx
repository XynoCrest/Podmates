import { colors, radii } from '@podmates/ui-tokens'
import { ActivityIndicator, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const STYLE: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.ink.DEFAULT, fg: colors.ink.inverse },
  secondary: { bg: colors.raised, fg: colors.ink.DEFAULT },
  ghost: { bg: 'transparent', fg: colors.ink.DEFAULT },
  danger: { bg: colors.danger.soft, fg: colors.danger.DEFAULT },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  flex,
  size = 'md',
}: {
  label: string
  onPress?: () => void
  variant?: Variant
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  flex?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const s = STYLE[variant]
  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} flex={flex} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          height,
          borderRadius: size === 'sm' ? 10 : radii.control,
          backgroundColor: s.bg,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {loading ? <ActivityIndicator color={s.fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} color={s.fg} weight="semibold" /> : null}
        <Text style={{ color: s.fg, fontSize: size === 'sm' ? 14 : 16, fontWeight: '600' }}>{label}</Text>
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
  const edge = disabled ? colors.line : lip
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={{ borderRadius: 16, backgroundColor: edge, paddingBottom: LIP }}>
          <Animated.View
            style={{
              height: 56,
              borderRadius: 16,
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
              <Text style={{ color: disabled ? colors.ink.subtle : textColor, fontSize: 17, fontWeight: '600' }}>{label}</Text>
            )}
          </Animated.View>
        </View>
      )}
    </Pressable>
  )
}
