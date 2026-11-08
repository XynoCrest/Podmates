import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'

export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 10 }}>
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
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
