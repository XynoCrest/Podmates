import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Chip } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { SnapFrame } from '@/features/snaps/components/SnapFrame'
import { SNAP_FIELDS, toSnap } from '@/features/snaps/hooks'
import { qk } from '@/lib/keys'
import { goBack } from '@/lib/nav'
import { supabase } from '@/lib/supabase'

/**
 * My snaps from one day, opened from the profile calendar. Tap right for the next,
 * left for the previous (like stories); past the last one closes the viewer.
 */
export default function DaySnaps() {
  const { date } = useLocalSearchParams<{ date: string }>()
  const me = useMe()
  const [index, setIndex] = useState(0)
  const snaps = useQuery({
    queryKey: qk.daySnaps(date),
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(`${SNAP_FIELDS}, pod:pods(name)`).eq('user_id', me).eq('pod_date', date).order('taken_at')
      if (error) throw error
      return data.map((s) => toSnap(s))
    },
  })

  const list = snaps.data ?? []
  const snap = list[index]
  if (!snap) return <View style={{ flex: 1, backgroundColor: '#000' }} />

  const next = () => (index < list.length - 1 ? setIndex(index + 1) : goBack())
  const prev = () => setIndex(Math.max(0, index - 1))
  const label = new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <View style={{ flex: 1 }}>
      <SnapFrame
        snap={snap}
        top={
          <View style={{ gap: 8 }}>
            {list.length > 1 ? (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {list.map((s, i) => (
                  <View key={s.id} style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: i <= index ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </View>
            ) : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Chip label={label} color="#fff" bg="rgba(0,0,0,0.55)" />
            </View>
          </View>
        }
      />
      {/* Tap zones sit below the top bar so the back button stays reachable. */}
      {list.length > 1 ? (
        <View style={{ position: 'absolute', top: 140, bottom: 160, left: 0, right: 0, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1 }} onPress={prev} accessibilityRole="button" accessibilityLabel="Previous snap" />
          <Pressable style={{ flex: 2 }} onPress={next} accessibilityRole="button" accessibilityLabel="Next snap" />
        </View>
      ) : null}
    </View>
  )
}
