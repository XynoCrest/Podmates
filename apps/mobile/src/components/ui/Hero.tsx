import { colors, hero, radii, space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'

/** How far the sheet rides up over the hero. */
export const HERO_OVERLAP = 22

/** The hero heading: a dark lead-in, then the bright line in white. One size on every tab. */
export const HERO_TITLE = { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 } as const

export function HeroHeading({ lead, bright, sub, fit }: { lead: string; bright: string; sub?: string; fit?: boolean }) {
  return (
    <View style={{ gap: space.sm }} accessible accessibilityRole="header" accessibilityLabel={[lead, bright, sub].filter(Boolean).join(' ')}>
      <View>
        <Text style={[HERO_TITLE, { color: hero.ink }]}>{lead}</Text>
        <Text style={[HERO_TITLE, { color: hero.bright }]} numeric adjustsFontSizeToFit={fit} numberOfLines={fit ? 1 : undefined}>
          {bright}
        </Text>
      </View>
      {sub ? (
        <Text variant="subhead" style={{ color: hero.soft }} numberOfLines={3}>
          {sub}
        </Text>
      ) : null}
    </View>
  )
}

/**
 * The top of a tab page: brand-green band with the hero heading, optional art on the
 * right, optional controls under the heading (a search bar). Leaves room at the bottom
 * for the sheet to ride up over it. `backfill` paints green above it so pulling down a
 * list shows more green, not the canvas.
 */
export function TabHero({ topInset, heading, art, children, minHeight }: { topInset: number; heading: ReactNode; art?: ReactNode; children?: ReactNode; minHeight?: number }) {
  return (
    <View style={{ backgroundColor: hero.bg }}>
      <View style={{ position: 'absolute', top: -2000, left: 0, right: 0, height: 2000, backgroundColor: hero.bg }} />
      <View style={{ minHeight, paddingTop: topInset + space.lg, paddingHorizontal: space.gutter, paddingBottom: HERO_OVERLAP + space.lg, gap: space.lg, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>{heading}</View>
          {art}
        </View>
        {children}
      </View>
    </View>
  )
}

/** The sheet under a hero: canvas, rounded top, riding up over the band. */
export function HeroSheet({ children }: { children?: ReactNode }) {
  return <View style={{ backgroundColor: colors.canvas, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, marginTop: -HERO_OVERLAP, paddingTop: 10 }}>{children}</View>
}
