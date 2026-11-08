import { colors, overlay, space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Header } from './Header'
import { Text } from './Text'

/*
 * Page templates. Every screen is one of these, so the top bar, padding, gaps and the
 * place of the main button are decided here, not per screen.
 *
 *   TabHero + HeroSheet  tab pages (Home, Explore)                 → Hero.tsx
 *   PushedScreen         pages pushed on the stack, with a back bar
 *   SheetScreen          form sheets: title, fields, button at the end
 *   StageScreen          full-screen modals: close bar, a big figure, a pinned button
 *   MediaScreen          photos and the camera: black, floating bar
 */

/** A pushed page: the shared back bar, then the content (a list fills the rest). */
export function PushedScreen({ title, subtitle, right, children }: { title?: ReactNode; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title={title} subtitle={subtitle} right={right} />
      {children}
    </View>
  )
}

/**
 * A form sheet's content (formSheet routes need a ScrollView root). Optional leading art
 * (an icon well, a photo), the title and a line under it, then the body; `action` (the
 * main button) comes at the end of the content, with the error under it.
 */
export function SheetScreen({
  title,
  subtitle,
  leading,
  action,
  error,
  children,
}: {
  title: string
  subtitle?: string
  leading?: ReactNode
  action?: ReactNode
  error?: string | null
  children?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.xxl, paddingBottom: insets.bottom + space.xxl, gap: space.xl }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ gap: space.md }}>
        {leading}
        <View style={{ gap: space.xs }}>
          <Text variant="title">{title}</Text>
          {subtitle ? <Text variant="subhead">{subtitle}</Text> : null}
        </View>
      </View>
      {children}
      {action || error ? (
        <View style={{ gap: space.sm }}>
          {action}
          {error ? (
            <Text variant="caption" center style={{ color: colors.danger.DEFAULT }}>
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  )
}

/**
 * A full-screen modal built around one figure (a tree): close bar with the title and a
 * trailing chip, scrolling body, and the main button pinned at the bottom.
 */
export function StageScreen({ title, right, footer, children }: { title: string; right?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header leading="close" title={title} right={right} border={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.xxl, gap: space.xxl }}>{children}</ScrollView>
      {footer ? <View style={{ paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: insets.bottom + space.md }}>{footer}</View> : null}
    </View>
  )
}

/** Photos and the camera: black ground, content edge to edge, the bar floating on top. */
export function MediaScreen({ header, children }: { header?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: overlay.media }}>
      {children}
      {header ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>{header}</View> : null}
    </View>
  )
}
