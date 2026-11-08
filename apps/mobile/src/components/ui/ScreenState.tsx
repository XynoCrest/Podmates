import { colors } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import type { IconName } from './Icon'

/**
 * Loading, error and empty, the same on every page. Loading is a centred spinner; error
 * offers a retry; empty is an EmptyState. `fill` centres it in the page instead of
 * placing it inline in a list.
 */
export function ScreenState({
  loading,
  error,
  onRetry,
  empty,
  fill,
  tone = 'default',
}: {
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  empty?: { icon: IconName; title: string; body?: string; action?: ReactNode }
  fill?: boolean
  tone?: 'default' | 'media'
}) {
  const box = fill ? { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const } : { alignItems: 'center' as const }
  if (loading) {
    return (
      <View style={[box, fill ? null : { paddingVertical: 48 }]}>
        <ActivityIndicator color={tone === 'media' ? '#FFFFFF' : colors.ink.muted} />
      </View>
    )
  }
  if (error) {
    return (
      <View style={box}>
        <EmptyState
          icon="warning"
          title="Couldn’t load this"
          body={error instanceof Error ? error.message : 'Check your connection and try again.'}
          action={onRetry ? <Button label="Try again" variant="secondary" size="sm" onPress={onRetry} /> : undefined}
        />
      </View>
    )
  }
  if (empty) {
    return (
      <View style={box}>
        <EmptyState {...empty} />
      </View>
    )
  }
  return null
}
