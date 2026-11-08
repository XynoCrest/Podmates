import { colors } from '@podmates/ui-tokens'
import { goBack } from '@/lib/nav'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/** Top bar for pushed screens: back · bold title (+ optional coloured subtitle) · trailing action. */
export function Header({
  title,
  subtitle,
  subtitleColor,
  right,
  onBack,
  border = true,
}: {
  title?: ReactNode
  subtitle?: string
  subtitleColor?: string
  right?: ReactNode
  onBack?: () => void
  border?: boolean
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.canvas, borderBottomWidth: border ? 1 : 0, borderBottomColor: colors.line }}>
      <View style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 6 }}>
        <IconButton icon="back" label="Back" onPress={onBack ?? goBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Text numberOfLines={1} style={{ fontSize: 21, fontWeight: '700', letterSpacing: -0.3 }}>
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle ? (
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: subtitleColor ?? colors.ink.muted }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  )
}

export function IconButton({ icon, label, onPress, color, size = 24 }: { icon: IconName; label: string; onPress?: () => void; color?: string; size?: number }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} scaleTo={0.9}>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={size} color={color ?? colors.ink.DEFAULT} weight="medium" />
      </View>
    </PressableScale>
  )
}

/** Text action in a header ("Post", "Retake"). */
export function HeaderAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
      <Text style={{ paddingHorizontal: 12, fontSize: 17, fontWeight: '700', color: disabled ? colors.ink.subtle : colors.leaf.DEFAULT }}>{label}</Text>
    </PressableScale>
  )
}

/** Sheet top bar: Cancel · centred title (+ subtitle) · green pill action (Pick snaps, New post). */
export function SheetHeader({ title, subtitle, onCancel, action, onAction, actionDisabled, actionLoading }: { title: string; subtitle?: string; onCancel: () => void; action: string; onAction: () => void; actionDisabled?: boolean; actionLoading?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface }}>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <PressableScale onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink.muted }}>Cancel</Text>
        </PressableScale>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 19, fontWeight: '700' }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 14, color: colors.ink.muted }}>{subtitle}</Text> : null}
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <PressableScale onPress={onAction} disabled={actionDisabled || actionLoading} accessibilityRole="button" accessibilityLabel={action}>
          <View style={{ height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.leaf.DEFAULT, alignItems: 'center', justifyContent: 'center', opacity: actionDisabled ? 0.45 : 1 }}>
            <Text style={{ color: colors.ink.inverse, fontSize: 17, fontWeight: '700' }}>{actionLoading ? '…' : action}</Text>
          </View>
        </PressableScale>
      </View>
    </View>
  )
}
