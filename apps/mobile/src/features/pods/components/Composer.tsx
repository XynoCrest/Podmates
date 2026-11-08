import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, inputText, Tile } from '@/components/ui'
import { haptics } from '@/lib/haptics'

/** Camera shortcut · message field · send. */
export function Composer({ onSend, onCamera, sending }: { onSend: (text: string) => void; onCamera: () => void; sending?: boolean }) {
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const canSend = text.trim().length > 0 && !sending
  const send = () => {
    if (!canSend) return
    haptics.tap()
    onSend(text.trim())
    setText('')
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Tile onPress={onCamera} accessibilityLabel="Snap a photo" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="camera" size={20} color={colors.ink.muted} />
      </Tile>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={colors.ink.subtle}
        multiline
        style={[inputText, { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }]}
      />
      <Tile tone={canSend ? 'leaf' : 'surface'} onPress={canSend ? send : undefined} accessibilityLabel="Send" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="send" size={18} color={canSend ? colors.leaf.DEFAULT : colors.ink.subtle} weight="bold" />
      </Tile>
    </View>
  )
}
