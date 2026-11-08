import { colors, radii, space } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Avatar, Button, HealthBar, Icon, Section, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import type { PodDay } from './hooks'

/** Pieces shared by the pod tree screen and the podmate pair tree screen. */

export function MemberRing({ members }: { members: { id: string; display_name: string; avatar_color: string; avatar_url: string | null; contributedToday: boolean; restingToday?: boolean }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 8 }}>
      {members.map((m) => (
        <View key={m.id} style={{ alignItems: 'center', gap: 4, opacity: m.contributedToday || m.restingToday ? 1 : 0.55 }}>
          <View>
            <Avatar person={m} size={40} />
            <View
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.canvas,
                backgroundColor: m.contributedToday ? colors.leaf.DEFAULT : m.restingToday ? colors.sky.DEFAULT : colors.raised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.contributedToday ? 'check' : m.restingToday ? 'moon' : 'clock'} size={10} color={m.contributedToday || m.restingToday ? colors.ink.inverse : colors.ink.subtle} weight="bold" />
            </View>
          </View>
          <Text variant="caption">{m.restingToday ? 'Resting' : firstName(m.display_name)}</Text>
        </View>
      ))}
    </View>
  )
}

export function Headline({ children }: { children: ReactNode }) {
  return (
    <Text variant="title" center>
      {children}
    </Text>
  )
}

export function Hl({ children, color }: { children: ReactNode; color: string }) {
  return (
    <Text variant="title" style={{ color }}>
      {children}
    </Text>
  )
}

export function StatCell({ label, value, sub, children }: { label: string; value: string; sub: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.lg, paddingHorizontal: space.md, gap: space.xs }}>
      <Text variant="overline">{label}</Text>
      <Text variant="title" numeric>
        {value}
      </Text>
      <Text variant="caption">
        {sub}
      </Text>
      {children}
    </View>
  )
}

const OUTCOME_STYLE: Record<PodDay['outcome'], { bg: string; fg: string; icon: 'leaf' | 'check' | 'arrowDown' | 'moon' }> = {
  thrive: { bg: colors.leaf.DEFAULT, fg: colors.ink.inverse, icon: 'leaf' },
  steady: { bg: colors.raised, fg: colors.ink.muted, icon: 'check' },
  wilt: { bg: colors.danger.soft, fg: colors.danger.DEFAULT, icon: 'arrowDown' },
  dormant: { bg: colors.surface, fg: colors.ink.subtle, icon: 'moon' },
}

/** Last seven settled days: green = grew, grey = held, red = wilted. */
export function WeekStrip({ days }: { days: PodDay[] }) {
  if (!days.length) return <Text variant="caption" center>{"The tree's first day ends tonight"}</Text>
  return (
    <View style={{ gap: 8 }}>
      <Text variant="overline" center>
        Last {days.length} days
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        {days.map((d) => {
          const s = OUTCOME_STYLE[d.outcome]
          const weekday = new Date(`${d.podDate}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' })
          return (
            <View key={d.podDate} style={{ alignItems: 'center', gap: 6 }} accessibilityLabel={`${d.podDate}: ${d.outcome}, ${d.contributors} of ${d.members}`}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} color={s.fg} weight="semibold" />
              </View>
              <Text variant="caption">{weekday}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/** Stage and health, side by side in one card. */
export function TreeStats({ stage, hp, maxHp, ratio, snapped }: { stage: { name: string; level: number; levels: number }; hp: number; maxHp: number; ratio: number; snapped: string }) {
  return (
    <View style={{ flexDirection: 'row', borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
      <StatCell label="Stage" value={stage.name} sub={`Level ${stage.level} of ${stage.levels}`} />
      <View style={{ width: 1, backgroundColor: colors.line }} />
      <StatCell label="Health" value={`${hp}/${maxHp}`} sub={snapped}>
        <View style={{ alignSelf: 'stretch', marginTop: space.sm }}>
          <HealthBar ratio={ratio} height={10} />
        </View>
      </StatCell>
    </View>
  )
}

/** Local-only buttons to move the game along while testing. */
export function DemoTools({ actions, error }: { actions: { label: string; onPress: () => void }[]; error?: Error | null }) {
  return (
    <View style={{ padding: space.md, borderRadius: radii.card, backgroundColor: colors.surface }}>
      <Section label="Demo tools · local only">
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {actions.map((a) => (
            <Button key={a.label} label={a.label} variant="secondary" size="sm" flex onPress={a.onPress} />
          ))}
        </View>
        {error ? (
          <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
            {error.message}
          </Text>
        ) : null}
      </Section>
    </View>
  )
}
