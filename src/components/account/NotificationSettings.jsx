import { Switch, Text, View } from 'react-native'
import { useNotificationSettings } from '../../notifications/settings'
import { useAuthStore } from '../../store/useAuthStore'
export const NotificationSettings = () => {
  const { enabled, busy, ready, message, change } = useNotificationSettings()
  const owner = useAuthStore((state) => state.user?.userId)
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        backgroundColor: '#eef7ef',
        borderRadius: 12,
        marginVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#163d2b', fontWeight: 'bold' }}>Device notifications</Text>
        <Switch
          accessibilityLabel="Enable device notifications"
          value={enabled}
          disabled={busy || !ready}
          onValueChange={(value) => void change(value, owner)}
          trackColor={{ true: '#17643a', false: '#777' }}
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: '#163d2b' }}>
        {message ||
          'Get order alerts even when Enzo Eats is closed. On iPhone, open the app from your Home Screen.'}
      </Text>
    </View>
  )
}
