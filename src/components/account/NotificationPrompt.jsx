import { useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, Text, View } from 'react-native'
import { useAuthStore } from '../../store/useAuthStore'
import { useNotificationSettings } from '../../notifications/settings'
export const NotificationPrompt = () => {
  const owner = useAuthStore((state) => state.user?.userId)
  const status = useAuthStore((state) => state.status)
  const { enabled, ready, busy, message, refresh, change } = useNotificationSettings()
  const considered = useRef(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (status === 'loading' || Platform.OS !== 'web') return undefined
    const update = () => void refresh(owner)
    // An auth change can arrive while the guest permission dialog is still open.
    let stopWaiting = () => {}
    if (useNotificationSettings.getState().busy) {
      stopWaiting = useNotificationSettings.subscribe((state) => {
        if (!state.busy) {
          stopWaiting()
          update()
        }
      })
    } else update()
    window.addEventListener('focus', update)
    return () => {
      stopWaiting()
      window.removeEventListener('focus', update)
    }
  }, [owner, status, refresh])
  useEffect(() => {
    if (ready && !busy && !considered.current && Platform.OS === 'web') {
      considered.current = true
      setVisible(!enabled)
    }
  }, [ready, busy, enabled])
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#0008',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 16,
            gap: 20,
            maxWidth: 420,
            width: '100%',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#163d2b' }}>Stay updated</Text>
          <Text style={{ color: '#163d2b' }}>
            Enable device notifications for signup results and order updates. You can change this in
            Account. On iPhone, add Enzo Eats to your Home Screen first.
          </Text>
          {!!message && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              {message}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={async () => {
              if (await change(true, owner)) setVisible(false)
            }}
          >
            <Text style={{ color: '#17643a', fontWeight: 'bold' }}>
              {busy ? 'Please wait...' : 'Enable notifications'}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setVisible(false)}>
            <Text style={{ color: '#555' }}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
