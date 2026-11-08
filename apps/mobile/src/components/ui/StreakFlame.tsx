import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Text } from './Text'

const FLAME = '#FF9600'

/** Streak flame: orange flame, a yellow drop at its heart and a spark breaking off the top-left. */
export function StreakFlame({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size * 0.8} height={size} viewBox="0 0 80 100">
      {/* Spark */}
      <Path d="M16 4 C12 11 10 15 10 18.5 a6 6 0 0 0 12 0 C22 15 20 11 16 4 Z" fill={FLAME} />
      {/* Flame: rounded base, small lick on the left, tall tip leaning right */}
      <Path
        d="M40 98 C18 98 4 84 4 64 C4 52 8 42 13 35 C15 32 19 33 19 37 L19 44 L35 24 C38 20 43 20 46 24 C58 38 76 52 76 66 C76 84 61 98 40 98 Z"
        fill={FLAME}
      />
      {/* Inner drop */}
      <Path d="M40 52 C34 61 27 68 27 77 a13 13 0 0 0 26 0 C53 68 46 61 40 52 Z" fill="#FFC800" />
    </Svg>
  )
}

/** Flame + count, the streak shown at the right of chat rows and in chat headers. */
export function StreakCount({ count, size = 22 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: count > 0 ? 1 : 0.4 }} accessibilityLabel={`${count} day streak`}>
      <StreakFlame size={size} />
      <Text numeric style={{ fontSize: Math.round(size * 0.78), fontWeight: '700', color: FLAME }}>
        {count}
      </Text>
    </View>
  )
}
