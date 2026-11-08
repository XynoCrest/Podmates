import { colors } from '@podmates/ui-tokens'
import type { ReactNode } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'

/** Outlined input with its label above (sign-in, new pod, edit profile, new post). */
export function TextField({ label, hint, multiline, style, ...props }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink.muted }}>
          {label}
          {hint ? <Text style={{ fontWeight: '400', color: colors.ink.muted }}> ({hint})</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.ink.subtle}
        multiline={multiline}
        {...props}
        style={[
          {
            minHeight: multiline ? 140 : 52,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            paddingHorizontal: 16,
            paddingTop: multiline ? 14 : 0,
            paddingBottom: multiline ? 14 : 0,
            textAlignVertical: multiline ? 'top' : 'center',
            color: colors.ink.DEFAULT,
            fontSize: 17,
          },
          style,
        ]}
      />
    </View>
  )
}

/** Small uppercase heading above a list ("YOUR PODS", "HOT RIGHT NOW"). */
export function SectionLabel({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <Text style={[{ fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: colors.ink.muted }, style]}>{children}</Text>
  )
}
