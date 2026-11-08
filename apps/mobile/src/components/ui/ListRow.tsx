import { colors, space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/** A round icon well, the default leading element of a row. */
export function RowIcon({ name, color = colors.ink.DEFAULT, bg = colors.raised, size = 44 }: { name: IconName; color?: string; bg?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <Icon name={name} size={20} color={color} />
    </View>
  )
}

/**
 * The one list row: leading (icon well or avatar) · title + detail · trailing (chevron,
 * check, chip, time). Full-width with the page gutter, so rows line up on every page.
 */
export function ListRow({
  leading,
  title,
  detail,
  trailing,
  onPress,
  busy,
  chevron,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  detailLines = 1,
}: {
  leading?: ReactNode
  title: ReactNode
  detail?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
  busy?: boolean
  /** Show a chevron when nothing else trails. */
  chevron?: boolean
  accessibilityLabel?: string
  accessibilityRole?: 'button' | 'checkbox' | 'radio' | 'link'
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean }
  detailLines?: number
}) {
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 10, gap: space.md }}>
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {typeof title === 'string' ? (
          <Text variant="label" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof detail === 'string' ? (
          <Text variant="callout" numberOfLines={detailLines} style={{ color: colors.ink.muted }}>
            {detail}
          </Text>
        ) : (
          detail
        )}
      </View>
      {busy ? <ActivityIndicator color={colors.ink.muted} /> : trailing ?? (chevron ? <Icon name="chevronRight" size={16} color={colors.ink.muted} /> : null)}
    </View>
  )
  if (!onPress) return row
  return (
    <PressableScale onPress={onPress} disabled={busy} scaleTo={0.98} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} accessibilityState={accessibilityState}>
      {row}
    </PressableScale>
  )
}
