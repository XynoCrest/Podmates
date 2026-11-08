import { colors } from '@podmates/ui-tokens'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import { envProblems } from '@/lib/env'

/** Shown instead of the app when EXPO_PUBLIC_* config is missing — never a silent fallback. */
export function ConfigError() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 44 }}>🌱</Text>
        <Text variant="title">{"Podmates isn't configured"}</Text>
        <Text variant="subhead">
          The app needs its local environment. From the repo root run:
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 6 }}>
          <Text style={{ fontFamily: 'Menlo', color: colors.leaf.DEFAULT }}>npm run db:start</Text>
          <Text style={{ fontFamily: 'Menlo', color: colors.leaf.DEFAULT }}>npm run env:local</Text>
        </View>
        <Text variant="subhead">Then restart Expo with a clean cache: npx expo start -c</Text>
        <View style={{ gap: 4 }}>
          {envProblems.map((p) => (
            <Text key={p} variant="caption" style={{ color: colors.danger.DEFAULT }}>
              {p}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
