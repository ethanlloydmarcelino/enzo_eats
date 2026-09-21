import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { enablePush, disablePush } from '../../notifications/push'

export const NotificationSettings = () => {
  const [message, setMessage] = useState(
    'Get order alerts on this device, even when Enzo Eats is closed. On iPhone, add this app to your Home Screen first.',
  )
  const [busy, setBusy] = useState(false)
  const change = async (enabled) => {
    setBusy(true)
    try {
      await (enabled ? enablePush() : disablePush())
      setMessage(
        enabled
          ? 'Notifications are enabled on this device.'
          : 'Notifications are off on this device.',
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <View
      style={{ padding: 16, gap: 12, backgroundColor: '#eef7ef', borderRadius: 12, marginTop: 20 }}
    >
      <Text style={{ color: '#163d2b', fontWeight: 'bold' }}>Device notifications</Text>
      <Text accessibilityLiveRegion="polite" style={{ color: '#163d2b' }}>
        {message}
      </Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void change(true)}>
        <Text style={{ color: '#17643a', fontWeight: 'bold' }}>
          {busy ? 'Please wait…' : 'Enable notifications'}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void change(false)}>
        <Text style={{ color: '#555' }}>Turn off on this device</Text>
      </Pressable>
    </View>
  )
}
