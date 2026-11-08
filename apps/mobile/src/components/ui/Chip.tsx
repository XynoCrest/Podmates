import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

/** Quiet meta: an icon and a number in a muted colour. No pill unless asked. */
export function Meta({ icon, label, color = colors.ink.subtle }: { icon?: IconName; label: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon ? <Icon name={icon} size={14} color={color} weight="medium" /> : null}
      <Text numeric style={{ color, fontSize: 13, lineHeight: 18, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  )
}
