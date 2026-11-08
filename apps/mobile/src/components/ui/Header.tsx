import { colors } from '@podmates/ui-tokens'
import { goBack } from '@/lib/nav'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/** Compact top bar for pushed screens: back · title/subtitle · trailing action. */
export function Header({ title, subtitle, right, onBack }: { title?: ReactNode; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.canvas, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 }}>
        <IconButton icon="back" label="Back" onPress={onBack ?? goBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Text variant="headline" numberOfLines={1}>
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle ? (
            <Text variant="caption" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  )
}

export function IconButton({ icon, label, onPress, color }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress?: () => void; color?: string }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} scaleTo={0.9}>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={color ?? colors.ink.DEFAULT} weight="medium" />
      </View>
    </PressableScale>
  )
}
