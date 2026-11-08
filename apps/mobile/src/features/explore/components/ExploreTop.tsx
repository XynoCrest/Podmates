import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { ScrollView, TextInput, View } from 'react-native'
import { Icon, PressableScale, SlideIndicator, Text, useOptionLayouts, type IconName } from '@/components/ui'
import { haptics } from '@/lib/haptics'
import type { Community } from '../hooks'

/** A glyph per seeded community; any other community shows its initial. */
const COMMUNITY_ICONS: Record<string, IconName> = {
  bookworms: 'book',
  runclub: 'run',
  swimmers: 'swim',
  mindful: 'mindful',
  gymrats: 'dumbbell',
  habitscience: 'brain',
}

/** Rounded search field. */
export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (text: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.raised }}>
      <Icon name="explore" size={17} color={colors.ink.muted} weight="semibold" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ink.muted}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{ flex: 1, height: 44, fontSize: 16, color: colors.ink.DEFAULT }}
      />
    </View>
  )
}

/** Big coloured circles with a label underneath, one per community. Joined ones first. */
export function CommunityCircles({ communities }: { communities: Community[] }) {
  const sorted = [...communities].sort((a, b) => Number(b.joined) - Number(a.joined))
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6, gap: 4 }}>
      {sorted.map((c) => {
        const icon = COMMUNITY_ICONS[c.slug]
        return (
          <PressableScale key={c.id} onPress={() => router.push({ pathname: '/community/[slug]', params: { slug: c.slug } })} scaleTo={0.95} accessibilityLabel={c.name}>
            <View style={{ width: 80, alignItems: 'center', gap: 8 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: avatarColors[c.color as keyof typeof avatarColors] ?? colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                {icon ? (
                  <Icon name={icon} size={26} color="#fff" />
                ) : (
                  <Text style={{ fontSize: 24, fontWeight: '600', color: '#fff' }}>{c.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} center style={{ fontSize: 13, lineHeight: 16, color: colors.ink.muted }}>
                {c.name}
              </Text>
            </View>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}

/** Text tabs with a sliding underline. */
export function UnderlineTabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string }[]; value: K; onChange: (key: K) => void }) {
  const { layouts, onLayoutFor } = useOptionLayouts<K>()
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 28, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <PressableScale
            key={t.key}
            onLayout={onLayoutFor(t.key)}
            onPress={() => {
              if (!active) haptics.select()
              onChange(t.key)
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            scaleTo={1}
          >
            <Text style={{ paddingVertical: 12, fontSize: 17, fontWeight: '600', color: active ? colors.ink.DEFAULT : colors.ink.muted }}>{t.label}</Text>
          </PressableScale>
        )
      })}
      <SlideIndicator at={layouts[value]} style={{ bottom: -0.5, height: 2.5, borderRadius: 2, backgroundColor: colors.ink.DEFAULT }} />
    </View>
  )
}
