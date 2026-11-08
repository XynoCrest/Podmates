/**
 * A menu of actions from the bottom of the screen, on both platforms.
 * iOS: the native action sheet. Android (and web): a bottom sheet drawn here, shown by
 * <ActionSheetHost />, which the root layout mounts once. Built with React Native's Modal,
 * so it needs no native module (keeps Expo Go working).
 */
import { colors } from '@podmates/ui-tokens'
import { useEffect, useState } from 'react'
import { ActionSheetIOS, Modal, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'

export interface SheetOption {
  label: string
  destructive?: boolean
  onPress: () => void
}

export interface Sheet {
  title?: string
  options: SheetOption[]
}

let show: ((sheet: Sheet) => void) | null = null

export function showActionSheet(sheet: Sheet) {
  if (Platform.OS === 'ios') {
    const destructive = sheet.options.flatMap((o, i) => (o.destructive ? [i] : []))
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: sheet.title,
        options: [...sheet.options.map((o) => o.label), 'Cancel'],
        cancelButtonIndex: sheet.options.length,
        destructiveButtonIndex: destructive.length ? destructive : undefined,
        userInterfaceStyle: 'dark',
      },
      (i) => sheet.options[i]?.onPress(),
    )
    return
  }
  show?.(sheet)
}

/** Draws the Android/web sheet. Mount once, near the root. */
export function ActionSheetHost() {
  const insets = useSafeAreaInsets()
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    show = (s) => {
      setSheet(s)
      setVisible(true)
    }
    return () => {
      show = null
    }
  }, [])

  // Close first, then act, so a navigation doesn't race the closing modal.
  const choose = (option?: SheetOption) => {
    setVisible(false)
    if (option) setTimeout(option.onPress, 0)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => choose()}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => choose()} accessibilityLabel="Close menu" />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingBottom: insets.bottom + 8 }}>
        {sheet?.title ? (
          <Text variant="caption" center style={{ paddingVertical: 10, paddingHorizontal: 24 }}>
            {sheet.title}
          </Text>
        ) : null}
        {sheet?.options.map((o) => (
          <Pressable key={o.label} onPress={() => choose(o)} accessibilityRole="button" android_ripple={{ color: colors.raised }} style={{ height: 52, justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 17, color: o.destructive ? colors.danger.DEFAULT : colors.ink.DEFAULT }}>{o.label}</Text>
          </Pressable>
        ))}
        <View style={{ height: 0.5, backgroundColor: colors.line, marginVertical: 6 }} />
        <Pressable onPress={() => choose()} accessibilityRole="button" android_ripple={{ color: colors.raised }} style={{ height: 52, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink.muted }}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
