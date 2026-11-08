import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

export type LabelTone = 'open' | 'done' | 'waiting' | 'dead' | 'onPhoto'

const TONES: Record<LabelTone, { bg: string; fg: string; icon: IconName }> = {
  open: { bg: colors.sun.soft, fg: colors.sun.DEFAULT, icon: 'timer' },
  done: { bg: colors.leaf.soft, fg: colors.leaf.DEFAULT, icon: 'check' },
  waiting: { bg: colors.raised, fg: colors.ink.muted, icon: 'clock' },
  dead: { bg: colors.danger.soft, fg: colors.danger.DEFAULT, icon: 'leaf' },
  onPhoto: { bg: 'rgba(18,17,15,0.72)', fg: colors.ink.DEFAULT, icon: 'clock' },
}

/**
 * The signature: a little wooden plant-stake tag (pointed left end, punched hole)
 * that carries a pod's snap status wherever it appears.
 */
export function PlantLabel({ tone, label, icon }: { tone: LabelTone; label: string; icon?: IconName }) {
  const t = TONES[tone]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel={label}>
      {/* The stake's point: a square turned 45°, half hidden under the body. */}
      <View style={{ width: 12, height: 12, backgroundColor: t.bg, transform: [{ rotate: '45deg' }], marginRight: -7, borderRadius: 2 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingLeft: 8, paddingRight: 8, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: t.bg }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.canvas, marginRight: 2 }} />
        <Icon name={icon ?? t.icon} size={12} color={t.fg} weight="semibold" />
        <Text numeric style={{ color: t.fg, fontSize: 12, lineHeight: 16, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    </View>
  )
}
