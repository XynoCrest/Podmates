import { colors } from '@podmates/ui-tokens'
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera'
import * as Device from 'expo-device'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Icon, PlantLabel, PressableScale, Text } from '@/components/ui'
import { podStatus } from '@/features/pods/components/PodRow'
import { needsSnap, useMyPods } from '@/features/pods/hooks'
import { setPendingCapture } from '@/features/snaps/pendingCapture'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/** The Simulator has no camera; it gets library + demo-photo buttons instead. */
const HAS_CAMERA = Device.isDevice

/**
 * Snapchat-style capture: full-bleed camera, controls in thumb reach, a big
 * shutter. Capture → the "Send to" sheet picks pods.
 */
export default function CameraScreen() {
  const { podId } = useLocalSearchParams<{ podId?: string }>()
  const insets = useSafeAreaInsets()
  const camera = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<FlashMode>('off')
  const [focused, setFocused] = useState(true)
  const [busy, setBusy] = useState(false)

  // Release the camera when the tab isn't visible (battery, and the green dot).
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  const goSend = (uri: string) => {
    setPendingCapture(uri)
    router.push({ pathname: '/send', params: { podId: podId ?? '' } })
  }

  async function shoot() {
    if (!camera.current || busy) return
    haptics.shutter()
    setBusy(true)
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, skipProcessing: false })
      if (photo?.uri) goSend(photo.uri)
    } finally {
      setBusy(false)
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [3, 4] })
    if (!result.canceled && result.assets[0]) goSend(result.assets[0].uri)
  }

  const useDemoPhoto = () => goSend(`https://picsum.photos/seed/${Date.now()}/1080/1440`)

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {HAS_CAMERA && permission?.granted && focused ? (
        <CameraView ref={camera} style={{ flex: 1 }} facing={facing} flash={flash} mirror={facing === 'front'} />
      ) : (
        <NoCamera
          reason={!HAS_CAMERA ? 'simulator' : permission && !permission.granted ? 'permission' : 'loading'}
          onAllow={requestPermission}
          onLibrary={pickFromLibrary}
          onDemo={useDemoPhoto}
        />
      )}

      {/* Top: what you're snapping for, and camera toggles. */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <OpenWindowPill podId={podId} />
        {HAS_CAMERA ? (
          <View style={{ gap: 8 }}>
            <RoundButton icon={flash === 'on' ? 'flashOn' : 'flashOff'} label="Flash" onPress={() => setFlash(flash === 'on' ? 'off' : 'on')} />
            <RoundButton icon="flip" label="Flip camera" onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} />
          </View>
        ) : null}
      </View>

      {/* Bottom: library · shutter · flip, above the floating tab bar. */}
      {HAS_CAMERA && permission?.granted ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
          <RoundButton icon="photo" label="Choose from library" onPress={pickFromLibrary} />
          <PressableScale onPress={shoot} scaleTo={0.9} accessibilityLabel="Take snap" disabled={busy}>
            <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 6, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: busy ? colors.ink.muted : 'rgba(255,255,255,0.25)' }} />
            </View>
          </PressableScale>
          <RoundButton icon="flip" label="Flip camera" onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} />
        </View>
      ) : null}
    </View>
  )
}

/** Which pod's window is open right now: the reason to snap. */
function OpenWindowPill({ podId }: { podId?: string }) {
  const now = useNow()
  const pods = useMyPods()
  const target = pods.data?.find((p) => p.id === podId) ?? pods.data?.find((p) => needsSnap(p, now))
  if (!target) return <View />
  const status = podStatus(target, now)
  return (
    <View style={{ gap: 4, maxWidth: '75%' }}>
      <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '600', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
        {target.name}
      </Text>
      <PlantLabel tone={status.tone === 'open' ? 'open' : 'onPhoto'} label={status.label} />
    </View>
  )
}

function RoundButton({ icon, label, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel={label}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color="#fff" weight="medium" />
      </View>
    </PressableScale>
  )
}

function NoCamera({ reason, onAllow, onLibrary, onDemo }: { reason: 'simulator' | 'permission' | 'loading'; onAllow: () => void; onLibrary: () => void; onDemo: () => void }) {
  if (reason === 'loading') return <View style={{ flex: 1 }} />
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12, backgroundColor: colors.sunken }}>
      <Icon name="camera" size={44} color={colors.ink.subtle} />
      <Text variant="headline" center>
        {reason === 'simulator' ? "The Simulator doesn't have a camera" : 'Podmates needs the camera to snap'}
      </Text>
      <Text variant="subhead" center>
        {reason === 'simulator' ? 'Pick a photo or use a demo shot — everything else works exactly like on a phone.' : 'Your snaps are proof for your pod. Nothing is recorded until you press the shutter.'}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 8 }}>
        {reason === 'permission' ? <Button label="Allow camera" icon="camera" onPress={onAllow} /> : null}
        <Button label="Choose from library" icon="photo" variant="secondary" onPress={onLibrary} />
        {reason === 'simulator' ? <Button label="Use a demo photo" icon="sparkles" variant="secondary" onPress={onDemo} /> : null}
      </View>
    </View>
  )
}
