import type { ReactNode } from 'react'
import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 }}>
      <View style={{ marginBottom: 8 }}>
        <Icon name={icon} size={36} color={colors.ink.subtle} weight="light" />
      </View>
      <Text variant="headline" center>
        {title}
      </Text>
      {body ? (
        <Text variant="subhead" center>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  )
}
