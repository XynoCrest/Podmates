import { alpha, colors, intro, space } from '@podmates/ui-tokens'
import { useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState, type ReactNode } from 'react'
import { Dimensions, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, HealthBar, HERO_OVERLAP, Icon, IconButton, IntroHeading, IntroSheet, ListRow, PressableScale, RowIcon, SymbolIcon, Text, type IconName } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useCommunities } from '@/features/explore/hooks'
import { useHabits } from '@/features/pods/hooks'
import type { Profile } from '@/features/profile/hooks'
import { haptics } from '@/lib/haptics'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'

/** Bundled so onboarding works offline: four demo podmates. */
const FACES = {
  maya: require('../../assets/onboarding/maya.jpg'),
  ben: require('../../assets/onboarding/ben.jpg'),
  priya: require('../../assets/onboarding/priya.jpg'),
  theo: require('../../assets/onboarding/theo.jpg'),
}

const STEPS = 5 // 0–2 tour, 3 habits, 4 pod
const TOUR = 3
const SCREEN_H = Dimensions.get('window').height
/** A figure never grows past this, however much room the sheet leaves. */
const MAX_FIG_H = Math.round(SCREEN_H * 0.3)
const COMPACT_FIG_H = 56
/** The habit list's height: the sheet shows most of it and scrolls the rest. */
const LIST_H = Math.round(SCREEN_H * 0.4)
const GIFS = {
  snap: { src: require('../../assets/onboarding/snap.gif'), aspect: 1 },
  streak: { src: require('../../assets/onboarding/streak.gif'), aspect: 1536 / 1024 },
  tree: { src: require('../../assets/onboarding/tree.gif'), aspect: 533 / 800, scale: 1.44 },
  habits: { src: require('../../assets/onboarding/habits.gif'), aspect: 1 },
  peas: { src: require('../../assets/onboarding/peas.gif'), aspect: 800 / 533 },
}
type Figure = { src: number; aspect: number; scale?: number }
/** Onboarding's hero: the intro tone (black ground, brand-green ink), as on sign-in. */
const GREEN = colors.leaf.DEFAULT
const TONE = intro
const OVERLAP = HERO_OVERLAP
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * First sign-in, once: three cards on how the app works (Ben's real rules), then pick
 * habits (joins their Explore communities), then start or join a pod (skippable).
 */
export default function Onboarding() {
  const me = useMe()
  const queryClient = useQueryClient()
  const habits = useHabits()
  const communities = useCommunities()
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const communitiesFor = (habitId: string) => communities.data?.filter((c) => c.habitId === habitId) ?? []
  const firstHabit = habits.data?.find((h) => h.id === picked[0])

  const go = (to: number) => {
    haptics.select()
    setStep(to)
  }
  const toggle = (id: string) => {
    haptics.select()
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  /** Join the picked habits' communities, mark onboarding done, then go home (and maybe on to a pod). */
  async function finish(next?: 'create' | 'join') {
    setSaving(true)
    setError(null)
    try {
      const toJoin = picked.flatMap(communitiesFor).filter((c) => !c.joined)
      if (toJoin.length) {
        const { error: jErr } = await supabase
          .from('community_members')
          .upsert(
            toJoin.map((c) => ({ community_id: c.id, user_id: me })),
            { onConflict: 'community_id,user_id', ignoreDuplicates: true },
          )
        // Skip-for-now still marks onboarding done even if a community join fails.
        if (jErr && next) throw jErr
      }
      const onboardedAt = new Date().toISOString()
      const { error: pErr } = await supabase.from('profiles').update({ onboarded_at: onboardedAt }).eq('id', me)
      if (pErr) throw pErr
      // Home redirects here while onboarded_at is empty: update the cache before leaving.
      queryClient.setQueryData<Profile>(qk.profile(me), (p) => (p ? { ...p, onboarded_at: onboardedAt } : p))
      void queryClient.invalidateQueries({ queryKey: qk.communities })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      haptics.success()
      router.replace('/')
      if (next) router.push({ pathname: '/pod/new', params: { tab: next, ...(picked[0] ? { habit: picked[0] } : {}) } })
    } catch (e) {
      haptics.error()
      setError(e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e && typeof e.message === 'string' ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const top = (
    <TopBar
      step={step}
      onBack={step > 0 ? () => go(step - 1) : undefined}
      onSkip={step < TOUR ? () => go(TOUR) : undefined}
    />
  )
  const next = (label = 'Next') => (
    <View style={{ paddingHorizontal: space.gutter, paddingTop: 8 }}>
      <Button label={label} size="lg" onPress={() => go(step + 1)} />
    </View>
  )

  // 1 · The window — the pod's snap time, and the camera that answers it.
  if (step === 0) {
    return (
      <HeroScreen top={top} lead="Snap at your" bright="pod’s time." sub="Each pod picks a daily snap time. When the window opens, snap a photo of your habit." figure={GIFS.snap}>
        {next()}
      </HeroScreen>
    )
  }

  // 2 · The streak — what this week looked like.
  if (step === 1) {
    return (
      <HeroScreen top={top} lead="On time keeps" bright="your streak." sub="Snaps in the window count. Missed it? Snap anyway: late snaps still show your pod you turned up." figure={GIFS.streak}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 8, gap: 14 }}>
          <View style={{ gap: 8 }} accessible accessibilityLabel="A 12-day streak: on time Monday to Saturday, today still open.">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="flame" size={16} color={colors.flame.DEFAULT} />
              <Text numeric style={{ fontSize: 17, fontWeight: '600' }}>
                12-day streak
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {WEEK.map((d, i) => (
                <View key={i} style={{ flex: 1, gap: 6, alignItems: 'center' }}>
                  <View style={{ width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: i < 6 ? GREEN : 'transparent', borderWidth: i < 6 ? 0 : 2, borderColor: colors.ink.DEFAULT }} />
                  <Text style={{ fontSize: 13, fontWeight: i === 6 ? '700' : '500', color: i === 6 ? colors.ink.DEFAULT : colors.ink.muted }}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Legend swatch={<View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: GREEN }} />} label="On time" />
            <Legend swatch={<View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, borderColor: GREEN }} />} label="Late" />
          </View>
        </View>
        {next()}
      </HeroScreen>
    )
  }

  // 3 · The tree — one per pod, grown by everyone.
  if (step === 2) {
    return (
      <HeroScreen top={top} lead="Grow a tree" bright="together." sub="Your pod shares one tree. It grows when everyone shows up and loses health when too many miss." figure={GIFS.tree}>
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 8, gap: 14 }}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: colors.ink.muted }}>Tree health</Text>
              <Text numeric style={{ fontSize: 15, fontWeight: '600' }}>
                92 / 105 HP
              </Text>
            </View>
            <HealthBar ratio={92 / 105} height={8} color={GREEN} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Faces names={['maya', 'ben', 'priya', 'theo']} dimLast size={32} />
            <Text style={{ flex: 1, fontSize: 15, lineHeight: 20, color: colors.ink.muted }}>
              <Text style={{ fontSize: 15, fontWeight: '600' }}>3 of 4 snapped.</Text> One more and it grows tonight.
            </Text>
          </View>
        </View>
        {next()}
      </HeroScreen>
    )
  }

  // 4 · Habits — a short hero, then a list like Home's pod rows.
  if (step === 3) {
    return (
      <HeroScreen top={top} lead="What are you" bright="working on?" sub="We’ll add you to each habit’s community on Explore." figure={GIFS.habits}>
        <ScrollView style={{ flexGrow: 0, maxHeight: LIST_H }} contentContainerStyle={{ paddingVertical: 4 }}>
          {habits.data?.map((h) => {
            const on = picked.includes(h.id)
            return (
              <PressableScale key={h.id} onPress={() => toggle(h.id)} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={h.name}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 8, gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? alpha(GREEN, 0.16) : colors.raised }}>
                    <SymbolIcon name={h.sf_symbol} size={20} color={on ? GREEN : colors.ink.muted} />
                  </View>
                  <Text variant="headline" numberOfLines={1} style={{ flex: 1, fontSize: 17 }}>
                    {h.name}
                  </Text>
                  <Icon name={on ? 'checkCircle' : 'circle'} size={24} color={on ? GREEN : colors.ink.subtle} />
                </View>
              </PressableScale>
            )
          })}
        </ScrollView>
        {next(picked.length ? `Continue with ${picked.length}` : 'Skip for now')}
      </HeroScreen>
    )
  }

  // 5 · The pod — the two ways in, as rows.
  return (
    <HeroScreen top={top} lead="Plant your" bright="first tree." sub="A pod is a few friends with one daily snap time and one tree." figure={GIFS.peas}>
      <ActionRow
        icon="plus"
        title="Start a pod"
        detail={firstHabit ? `Choose a snap time for ${firstHabit.name}, then invite friends.` : 'Pick a habit and a snap time, then invite friends.'}
        onPress={() => void finish('create')}
        busy={saving}
      />
      <ActionRow icon="personAdd" title="Join with code" detail="A friend sent you an invite code." onPress={() => void finish('join')} busy={saving} />
      <View style={{ paddingHorizontal: space.gutter, paddingTop: 6 }}>
        <Button label="Skip for now" variant="ghost" onPress={() => void finish()} disabled={saving} />
        {error ? (
          <Text variant="caption" center style={{ color: colors.danger.DEFAULT }}>
            {error}
          </Text>
        ) : null}
      </View>
    </HeroScreen>
  )
}

/**
 * Every step's frame: a black hero with the two-tone heading and a looping GIF
 * in the leftover space. `compact` puts the GIF beside the heading instead.
 */
function HeroScreen({ top, lead, bright, sub, figure, compact, children }: { top: ReactNode; lead: string; bright: string; sub: string; figure: Figure; compact?: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const [box, setBox] = useState({ w: 0, h: 0 })
  const figH = Math.max(0, Math.min(box.h - 8, (box.w - 40) / figure.aspect, MAX_FIG_H * (figure.scale ?? 1)))
  const gif = (h: number) => <Image source={figure.src} style={{ width: h * figure.aspect, height: h }} contentFit="contain" accessible={false} />
  const heading = <IntroHeading lead={lead} bright={bright} sub={sub} />
  return (
    <View style={{ flex: 1, backgroundColor: TONE.bg }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {top}
        {compact ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: OVERLAP + 16, gap: 12 }}>
            <View style={{ flex: 1 }}>{heading}</View>
            {gif(COMPACT_FIG_H)}
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: space.gutter, paddingTop: 12 }}>{heading}</View>
            <View
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: OVERLAP }}
              onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height - OVERLAP })}
              accessible={false}
            >
              {figH > 40 ? gif(figH) : null}
            </View>
          </>
        )}
      </View>
      <IntroSheet bottomInset={insets.bottom}>{children}</IntroSheet>
    </View>
  )
}

/** Back · progress dashes · Skip, in green on the black hero. */
function TopBar({ step, onBack, onSkip }: { step: number; onBack?: () => void; onSkip?: () => void }) {
  return (
    <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
      <View style={{ width: 64 }}>{onBack ? <IconButton icon="back" label="Back" onPress={onBack} color={TONE.ink} /> : null}</View>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }} accessible accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: i === step ? TONE.ink : TONE.faint }} />
        ))}
      </View>
      <View style={{ width: 64, alignItems: 'flex-end', paddingRight: 8 }}>
        {onSkip ? (
          <PressableScale onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip the tour" hitSlop={12}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: TONE.ink }}>Skip</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  )
}

/** Overlapping demo faces; `dimLast` greys out someone who hasn't snapped yet. */
function Faces({ names, size, dimLast }: { names: (keyof typeof FACES)[]; size: number; dimLast?: boolean }) {
  return (
    <View style={{ flexDirection: 'row' }} accessible={false}>
      {names.map((n, i) => (
        <Image
          key={n}
          source={FACES[n]}
          style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.canvas, marginLeft: i ? -size * 0.3 : 0, opacity: dimLast && i === names.length - 1 ? 0.35 : 1 }}
        />
      ))}
    </View>
  )
}

/** One way into a pod: the shared list row. */
function ActionRow({ icon, title, detail, onPress, busy }: { icon: IconName; title: string; detail: string; onPress: () => void; busy: boolean }) {
  return <ListRow leading={<RowIcon name={icon} size={48} />} title={title} detail={detail} detailLines={2} onPress={onPress} busy={busy} chevron accessibilityLabel={`${title}. ${detail}`} />
}

function Legend({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {swatch}
      <Text variant="subhead">{label}</Text>
    </View>
  )
}
