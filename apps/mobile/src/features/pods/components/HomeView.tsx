import { colors } from '@podmates/ui-tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { RefreshControl, ScrollView, View, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Glyph, GradientHealthBar, Icon, PeaPodMark, PressableScale, Text, type AvatarPerson, type GlyphName } from '@/components/ui'

/** The streak ring gradient — green, because a kept streak is a growing thing. */
const RING = ['#C9F36A', '#4BBF5F', '#1F7A3A'] as const

export interface RailItem {
  id: string
  label: string
  glyph: GlyphName
  streak: number
  /** Snapped today: ring and badge go green, otherwise both go quiet. */
  done: boolean
}

export interface PodmateItem {
  id: string
  person: AvatarPerson
  /** "Read · 11 hrs left" */
  sub: string
  glyph: GlyphName
  streak: number
  /** Unseen snap in the last 24h → gradient ring. */
  fresh: boolean
  /** Overrides the habit mark + count colour; defaults to green when fresh. */
  tint?: ColorValue
}

export interface PodItem {
  id: string
  name: string
  /** "Matt posted 1 min ago" */
  sub: string
  person: AvatarPerson
  /** 0–1 tree health. */
  ratio: number
}

/**
 * Home, as designed on feature/Test-Frontend: streak rings on top, the people
 * you share a habit with, then your pods with their health.
 *
 * Presentational on purpose — every value arrives as a prop so the same screen
 * renders from the live hooks in (tabs)/index and from fixtures in /preview.
 */
export function HomeView({
  rail,
  podmates,
  pods,
  onOpenHabit,
  onAddHabit,
  onOpenMessages,
  onOpenPodmate,
  onOpenPod,
  header,
  refreshing,
  onRefresh,
}: {
  rail: RailItem[]
  podmates: PodmateItem[]
  pods: PodItem[]
  onOpenHabit?: (id: string) => void
  onAddHabit?: () => void
  onOpenMessages?: () => void
  onOpenPodmate?: (id: string) => void
  onOpenPod?: (id: string) => void
  /** Extra chrome under the rail, e.g. the open-window banner. */
  header?: React.ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PeaPodMark width={46} />
          <Text variant="title" style={{ fontSize: 23, letterSpacing: -0.8 }}>
            Peas
          </Text>
        </View>
        <PressableScale onPress={onAddHabit} accessibilityLabel="Add a habit" style={pill}>
          <Icon name="plus" size={22} />
        </PressableScale>
        <PressableScale onPress={onOpenMessages} accessibilityLabel="Messages" style={pill}>
          <Icon name="comment" size={22} />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl tintColor={colors.ink.muted} refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      >
        <StreakRail items={rail} onOpen={onOpenHabit} onAdd={onAddHabit} />
        {header}

        {podmates.length ? (
          <>
            <SectionHead title="Podmates" />
            {podmates.map((p) => (
              <PressableScale key={p.id} onPress={() => onOpenPodmate?.(p.id)} scaleTo={0.98} accessibilityLabel={p.person.display_name}>
                <Row person={p.person} ring={p.fresh ? 'unseen' : 'seen'} name={p.person.display_name} sub={p.sub}>
                  <Count glyph={p.glyph} streak={p.streak} color={p.tint ?? (p.fresh ? colors.leaf.DEFAULT : colors.ink.muted)} />
                </Row>
              </PressableScale>
            ))}
          </>
        ) : null}

        <SectionHead title="Pods" />
        {pods.map((pod) => (
          <PressableScale key={pod.id} onPress={() => onOpenPod?.(pod.id)} scaleTo={0.98} accessibilityLabel={pod.name}>
            <Row person={pod.person} ring="seen" name={pod.name} sub={pod.sub}>
              <GradientHealthBar ratio={pod.ratio} />
            </Row>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  )
}

const pill = { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' } as const

/** A podmate's habit mark and their count, both in the same colour. */
function Count({ glyph, streak, color }: { glyph: GlyphName; streak: number; color: ColorValue }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Glyph name={glyph} size={19} color={color} />
      <Text numeric style={{ fontSize: 19, fontWeight: '800', letterSpacing: -0.6, color }}>
        {streak}
      </Text>
    </View>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 }}>
      <Text style={{ fontSize: 19, fontWeight: '800', letterSpacing: -0.6 }}>{title}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.leaf.DEFAULT }}>See all</Text>
    </View>
  )
}

/** Avatar · name · subtitle · whatever goes on the right. */
function Row({
  person,
  ring,
  name,
  sub,
  children,
}: {
  person: AvatarPerson
  ring: 'unseen' | 'seen'
  name: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 9 }}>
      <Avatar person={person} size={46} ring={ring} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>
          {name}
        </Text>
        <Text numberOfLines={1} variant="subhead" style={{ marginTop: 1, fontSize: 13 }}>
          {sub}
        </Text>
      </View>
      {children}
    </View>
  )
}

/**
 * The streak rail: the count sits in the middle of the ring and the habit mark
 * rides in the badge, so the number you're protecting is the thing you read first.
 */
function StreakRail({ items, onOpen, onAdd }: { items: RailItem[]; onOpen?: (id: string) => void; onAdd?: () => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 2, paddingBottom: 16, gap: 16 }}>
      {items.map((item) => (
        <PressableScale key={item.id} onPress={() => onOpen?.(item.id)} accessibilityLabel={`${item.label}, ${item.streak} day streak`}>
          <View style={{ width: 68, alignItems: 'center', gap: 7 }}>
            <Ring active={item.done}>
              <Text numeric style={{ fontSize: 23, fontWeight: '800', letterSpacing: -1, color: item.done ? colors.ink.DEFAULT : colors.ink.muted }}>
                {item.streak}
              </Text>
              <Badge color={item.done ? colors.leaf.DEFAULT : colors.line}>
                <Glyph name={item.glyph} size={15} color={item.done ? colors.ink.inverse : colors.ink.muted} />
              </Badge>
            </Ring>
            <Text variant="caption" numberOfLines={1} style={{ color: colors.ink.muted }}>
              {item.label}
            </Text>
          </View>
        </PressableScale>
      ))}
      <PressableScale onPress={onAdd} accessibilityLabel="Add a habit">
        <View style={{ width: 68, alignItems: 'center', gap: 7 }}>
          <Ring active={false}>
            <Glyph name="plus" size={24} color={colors.ink.muted} />
          </Ring>
          <Text variant="caption" style={{ color: colors.ink.muted }}>
            Add
          </Text>
        </View>
      </PressableScale>
    </ScrollView>
  )
}

const SIZE = 66

function Ring({ active, children }: { active: boolean; children: React.ReactNode }) {
  const face = (
    <View style={{ width: SIZE - 5, height: SIZE - 5, borderRadius: SIZE, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  )
  return active ? (
    <LinearGradient colors={RING} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={ringStyle}>
      {face}
    </LinearGradient>
  ) : (
    <View style={[ringStyle, { backgroundColor: colors.line }]}>{face}</View>
  )
}

const ringStyle = { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' } as const

function Badge({ color, children }: { color: ColorValue; children: React.ReactNode }) {
  return (
    <View
      style={{
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: color,
        borderWidth: 2.5,
        borderColor: colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  )
}
