import { radii } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/**
 * Pill: icon + value, tinted. `sm` sits inside rows and photos (🔥 streak, ⏱ window,
 * on time); `md` is a header action (the pod's tree, a pair streak). Pass `onPress` to make
 * it a button.
 */
export function Chip({
  icon,
  label,
  color,
  bg,
  size = 'sm',
  onPress,
  accessibilityLabel,
}: {
  icon?: IconName
  label: string
  color: string
  bg: string
  size?: 'sm' | 'md'
  onPress?: () => void
  accessibilityLabel?: string
}) {
  const md = size === 'md'
  const pill = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: md ? 6 : 4, paddingHorizontal: md ? 12 : 8, height: md ? 32 : 24, borderRadius: radii.chip, backgroundColor: bg }}>
      {icon ? <Icon name={icon} size={md ? 14 : 12} color={color} weight="bold" /> : null}
      <Text numeric style={{ color, fontSize: md ? 14 : 12, lineHeight: md ? 18 : 16, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  )
  if (!onPress) return pill
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} hitSlop={6}>
      {pill}
    </PressableScale>
  )
}
