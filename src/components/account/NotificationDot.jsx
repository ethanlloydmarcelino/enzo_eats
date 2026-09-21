import { View } from 'react-native'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useAuthStore } from '../../store/useAuthStore'

export const NotificationDot = () => {
  const { unread, owner } = useNotificationStore()
  const current = useAuthStore((state) => state.user?.userId)
  return unread > 0 && current === owner ? (
    <View
      accessibilityLabel="New notifications"
      style={{
        position: 'absolute',
        top: 4,
        right: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#dc2626',
        borderWidth: 1,
        borderColor: '#fff',
      }}
    />
  ) : null
}
