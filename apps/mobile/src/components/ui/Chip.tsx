import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

/** Small pill: icon + value, tinted. Used for ⚡ energy, 🔥 streak, ⏱ window. */
export function Chip({ icon, label, color, bg }: { icon?: IconName; label: string; color: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: bg }}>
      {icon ? <Icon name={icon} size={12} color={color} weight="bold" /> : null}
      <Text numeric style={{ color, fontSize: 12, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  )
}
