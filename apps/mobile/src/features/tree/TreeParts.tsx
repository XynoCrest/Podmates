import { colors } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import type { PodDay } from './hooks'

/** Pieces shared by the pod tree screen and the podmate pair tree screen. */

export function MemberRing({ members }: { members: { id: string; display_name: string; avatar_color: string; avatar_url: string | null; contributedToday: boolean }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 8 }}>
      {members.map((m) => (
        <View key={m.id} style={{ alignItems: 'center', gap: 4, opacity: m.contributedToday ? 1 : 0.55 }}>
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
                backgroundColor: m.contributedToday ? colors.leaf.DEFAULT : colors.raised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.contributedToday ? 'check' : 'clock'} size={10} color={m.contributedToday ? colors.ink.inverse : colors.ink.subtle} weight="bold" />
            </View>
          </View>
          <Text variant="caption">{firstName(m.display_name)}</Text>
        </View>
      ))}
    </View>
  )
}

export function Headline({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: '600', textAlign: 'center', color: colors.ink.DEFAULT, letterSpacing: -0.2 }}>{children}</Text>
}

export function Hl({ children, color }: { children: ReactNode; color: string }) {
  return <Text style={{ color, fontSize: 26, lineHeight: 32, fontWeight: '600' }}>{children}</Text>
}

export function StatCell({ label, value, sub, children }: { label: string; value: string; sub: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 }}>
      <Text variant="overline">{label}</Text>
      <Text numeric style={{ fontWeight: '600', fontSize: 24, lineHeight: 28, marginTop: 4 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ marginTop: 4 }}>
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

export function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} flex accessibilityLabel={label}>
      <View style={{ height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink.muted }}>{label}</Text>
      </View>
    </PressableScale>
  )
}
