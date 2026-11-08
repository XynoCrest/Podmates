import { colors, hero, intro, radii, space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'

/** How far the sheet rides up over the hero. */
export const HERO_OVERLAP = 22

/** Height of a tab page's green band below the status bar (Home and Explore match). */
export const TAB_HERO_H = 196

/** The hero heading: a dark lead-in, then the bright line in white. One size on every tab. */
export const HERO_TITLE = { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 } as const

/** `oneLine` sets lead and bright on a single line (a short heading with no art beside it). */
export function HeroHeading({ lead, bright, sub, fit, oneLine }: { lead: string; bright: string; sub?: string; fit?: boolean; oneLine?: boolean }) {
  return (
    <View style={{ gap: space.sm }} accessible accessibilityRole="header" accessibilityLabel={[lead, bright, sub].filter(Boolean).join(' ')}>
      {oneLine ? (
        <Text style={[HERO_TITLE, { color: hero.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {lead} <Text style={[HERO_TITLE, { color: hero.bright }]}>{bright}</Text>
        </Text>
      ) : (
        <View>
          <Text style={[HERO_TITLE, { color: hero.ink }]}>{lead}</Text>
          <Text style={[HERO_TITLE, { color: hero.bright }]} numeric adjustsFontSizeToFit={fit} numberOfLines={fit ? 1 : undefined}>
            {bright}
          </Text>
        </View>
      )}
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
 * list shows more green, not the canvas. `backdrop` is drawn behind the heading, positioned by
 * the caller (art that bleeds to the screen edge).
 */
export function TabHero({ topInset, heading, art, backdrop, children, minHeight }: { topInset: number; heading: ReactNode; art?: ReactNode; backdrop?: ReactNode; children?: ReactNode; minHeight?: number }) {
  return (
    <View style={{ backgroundColor: hero.bg }}>
      <View style={{ position: 'absolute', top: -2000, left: 0, right: 0, height: 2000, backgroundColor: hero.bg }} />
      {backdrop}
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

/** The sheet under a hero: canvas, rounded top, riding up over the band. `clip` trims children to the corners. */
export function HeroSheet({ children, clip }: { children?: ReactNode; clip?: boolean }) {
  return <View style={{ backgroundColor: colors.canvas, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, marginTop: -HERO_OVERLAP, paddingTop: 10, overflow: clip ? 'hidden' : undefined }}>{children}</View>
}

/** The intro heading (sign-in, onboarding): larger, green lead-in and the bright line in white. */
export const INTRO_TITLE = { fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 } as const

export function IntroHeading({ lead, bright, sub }: { lead: string; bright: string; sub?: string }) {
  return (
    <View style={{ gap: space.sm, flexShrink: 1 }}>
      <View accessible accessibilityRole="header" accessibilityLabel={`${lead} ${bright}`}>
        <Text style={[INTRO_TITLE, { color: intro.ink }]}>{lead}</Text>
        <Text style={[INTRO_TITLE, { color: intro.bright }]}>{bright}</Text>
      </View>
      {sub ? (
        <Text variant="callout" style={{ color: intro.soft }}>
          {sub}
        </Text>
      ) : null}
    </View>
  )
}

/** The sheet under an intro hero: canvas with a hairline top edge so it reads on black. */
/** `grow` stretches it to the bottom of a scrolling page. */
export function IntroSheet({ children, bottomInset = 0, grow }: { children?: ReactNode; bottomInset?: number; grow?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: colors.canvas,
        borderTopLeftRadius: radii.sheet,
        borderTopRightRadius: radii.sheet,
        borderTopWidth: 1,
        borderColor: colors.raised,
        marginTop: -HERO_OVERLAP,
        paddingTop: space.md,
        paddingBottom: bottomInset + space.md,
        flexGrow: grow ? 1 : 0,
      }}
    >
      {children}
    </View>
  )
}
