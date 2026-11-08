import { colors, radii, space } from '@podmates/ui-tokens'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'

/**
 * The one text input: optional label above, raised field, optional hint or error below.
 * `multiline` grows from three lines. Same radius as buttons.
 */
export function TextField({ label, hint, error, multiline, style, ...props }: TextInputProps & { label?: string; hint?: string; error?: string | null }) {
  return (
    <View style={{ gap: space.sm }}>
      {label ? <Text variant="overline">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.ink.subtle}
        multiline={multiline}
        // Screen readers announce the field's label, and its error when there is one.
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        {...props}
        style={[
          {
            minHeight: multiline ? 96 : 48,
            borderRadius: radii.control,
            backgroundColor: colors.raised,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            color: colors.ink.DEFAULT,
            fontSize: 16,
            textAlignVertical: multiline ? 'top' : 'center',
            borderWidth: error ? 1 : 0,
            borderColor: colors.danger.DEFAULT,
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  )
}
