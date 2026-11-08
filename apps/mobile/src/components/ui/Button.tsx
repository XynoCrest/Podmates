import { colors } from '@podmates/ui-tokens'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sun'

const STYLE: Record<Variant, { face: string; lip: string; fg: string; border?: string }> = {
  primary: { face: colors.leaf.DEFAULT, lip: colors.leaf.deep, fg: colors.ink.inverse },
  sun: { face: colors.sun.DEFAULT, lip: colors.sun.deep, fg: colors.ink.inverse },
  secondary: { face: colors.surface, lip: colors.lip, fg: colors.ink.DEFAULT, border: colors.lip },
  danger: { face: colors.surface, lip: colors.lip, fg: colors.danger.DEFAULT, border: colors.lip },
  ghost: { face: 'transparent', lip: 'transparent', fg: colors.ink.muted },
}

/**
 * Chunky, pressable button: a solid face sitting on a darker lip. On touch-down the
 * face drops into the lip, so the press is felt immediately.
 */
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
  const s = disabled ? { face: colors.raised, lip: colors.line, fg: colors.ink.subtle } : STYLE[variant]
  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
  const lip = variant === 'ghost' ? 0 : size === 'sm' ? 3 : 4
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={flex ? { flex: 1 } : undefined}
      hitSlop={4}
    >
      {({ pressed }) => (
        <View style={{ borderRadius: 14, backgroundColor: s.lip, paddingBottom: pressed ? 0 : lip, marginTop: pressed ? lip : 0 }}>
          <View
            style={{
              height,
              borderRadius: 14,
              backgroundColor: s.face,
              borderWidth: 'border' in s && s.border ? 2 : 0,
              borderColor: 'border' in s ? s.border : undefined,
              paddingHorizontal: size === 'sm' ? 12 : 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color={s.fg} />
            ) : icon ? (
              <Icon name={icon} size={size === 'sm' ? 16 : 18} color={s.fg} weight="semibold" />
            ) : null}
            <Text style={{ color: s.fg, fontSize: size === 'sm' ? 14 : 16, fontWeight: '600' }}>{label}</Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}
