import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pressable, Text, View } from 'react-native'
import { dataClient, throwOnErrors } from '../../orders/client'
import { useAuthStore } from '../../store/useAuthStore'
import { useOrderStore } from '../../store/useOrderStore'
import { useTranslations } from '../../translations'

export const AccountSync = () => {
  const owner = useAuthStore((state) => state.user?.userId)
  const status = useAuthStore((state) => state.status)
  const error = useOrderStore((state) => state.preferencesError)
  const cache = useQueryClient()
  const { t } = useTranslations()
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    if (status === 'loading') return undefined
    if (!owner) cache.removeQueries({ queryKey: ['orders'] })
    useOrderStore.setState({
      favorites: [],
      pictureUrl: '',
      preferencesOwner: owner ?? null,
      preferencesReady: false,
      preferencesError: false,
    })
    if (status === 'signedIn' && owner) {
      void Promise.resolve()
        .then(() => dataClient.models.AccountPreferences.get({ id: owner }))
        .then(throwOnErrors)
        .then((data) => {
          if (active)
            useOrderStore.setState({
              favorites: data?.favoriteIds ?? [],
              pictureUrl: data?.pictureUrl ?? '',
              preferencesReady: true,
            })
        })
        .catch(() => {
          if (active) useOrderStore.setState({ preferencesError: true })
        })
    }
    return () => {
      active = false
    }
  }, [owner, status, cache, retry])
  return error ? (
    <View style={{ backgroundColor: '#fff', padding: 10 }}>
      <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
        {t('preferencesError')}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}>
        <Text>{t('authRetry')}</Text>
      </Pressable>
    </View>
  ) : null
}
