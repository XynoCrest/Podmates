import { colors, overlay } from '@podmates/ui-tokens'
import { goBack } from '@/lib/nav'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconName } from './Icon'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

/**
 * The one top bar for every page that isn't a tab hero: back (pushed pages) or close
 * (full-screen modals) · title/subtitle · trailing actions. `tone="media"` floats it,
 * transparent, over photos and the camera.
 */
export function Header({
  title,
  subtitle,
  right,
  onBack,
  leading = 'back',
  tone = 'default',
  border = true,
}: {
  title?: ReactNode
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
  /** back: a pushed page · close: a full-screen modal · none: a tab page. */
  leading?: 'back' | 'close' | 'none'
  tone?: 'default' | 'media'
  border?: boolean
}) {
  const insets = useSafeAreaInsets()
  const media = tone === 'media'
  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: media ? 'transparent' : colors.canvas,
        borderBottomWidth: border && !media ? 0.5 : 0,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ height: HEADER_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 }}>
        {leading === 'none' ? <View style={{ width: 8 }} /> : (
          <IconButton icon={leading === 'close' ? 'close' : 'back'} label={leading === 'close' ? 'Close' : 'Back'} onPress={onBack ?? goBack} tone={media ? 'media' : 'plain'} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Text variant="headline" numberOfLines={1} style={media ? { color: overlay.ink } : undefined}>
              {title}
            </Text>
          ) : (
            title
          )}
          {subtitle ? (
            <Text variant="caption" numberOfLines={1} style={media ? { color: overlay.ink, opacity: 0.8 } : undefined}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  )
}

/** Height of the bar below the status bar. */
export const HEADER_H = 52

/** A 40pt icon target. `media` puts it on a translucent disc so it reads over photos. */
export function IconButton({ icon, label, onPress, color, tone = 'plain' }: { icon: IconName; label: string; onPress?: () => void; color?: string; tone?: 'plain' | 'media' }) {
  const media = tone === 'media'
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} scaleTo={0.9}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: media ? overlay.scrim : 'transparent' }}>
        <Icon name={icon} size={media ? 20 : 22} color={color ?? (media ? overlay.ink : colors.ink.DEFAULT)} weight="medium" />
      </View>
    </PressableScale>
  )
}
