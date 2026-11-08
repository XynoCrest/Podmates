import { space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'

/** A labelled group: quiet overline, then its content, always the same gap apart. */
export function Section({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="overline">{label}</Text>
        {right}
      </View>
      {children}
    </View>
  )
}
