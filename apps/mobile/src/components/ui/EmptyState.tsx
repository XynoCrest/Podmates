import { colors } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.lip, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={colors.ink.muted} />
      </View>
      <Text variant="headline" center>
        {title}
      </Text>
      {body ? (
        <Text variant="subhead" center>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  )
}
