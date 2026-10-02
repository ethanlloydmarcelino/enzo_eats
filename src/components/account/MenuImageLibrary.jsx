import { createElement, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import { uploadData } from 'aws-amplify/storage'
import { dataClient, throwOnErrors } from '../../orders/client'
import { imageForRecord } from '../../data/menu'
import { useAuthStore } from '../../store/useAuthStore'
import { checkImage } from '../../menu/images.mjs'

export const MenuImageLibrary = ({ colors, onSelect }) => {
  const { user, role, status } = useAuthStore()
  const allowed = status === 'signedIn' && ['admin', 'super_admin'].includes(role)
  const [tokens, setTokens] = useState([undefined])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pendingAsset, setPendingAsset] = useState(null)
  const cache = useQueryClient()
  const query = useQuery({
    queryKey: ['menu-images', user?.userId, role, tokens.at(-1)],
    enabled: allowed,
    queryFn: async () => {
      const page = await dataClient.models.MenuImage.list({ limit: 24, nextToken: tokens.at(-1) })
      const data = throwOnErrors(page)
      return {
        data: await Promise.all(
          data.map(async (asset) => ({ ...asset, image: await imageForRecord(asset) })),
        ),
        nextToken: page.nextToken,
      }
    },
  })
  const register = async (asset) => {
    const existing = throwOnErrors(await dataClient.models.MenuImage.get({ id: asset.id }))
    if (!existing) throwOnErrors(await dataClient.models.MenuImage.create(asset))
    setPendingAsset(null)
    setMessage('Photo saved in your library.')
    setTokens([undefined])
    await cache.invalidateQueries({ queryKey: ['menu-images'] })
    onSelect?.(asset.id)
  }
  const upload = async (file) => {
    if (!file || !allowed || busy) return
    setBusy(true)
    setMessage('')
    try {
      const extension = checkImage(
        file.type,
        file.size,
        new Uint8Array(await file.slice(0, 12).arrayBuffer()),
      )
      const id = globalThis.crypto.randomUUID()
      const asset = {
        id,
        path: 'menu-images/' + id + '.' + extension,
        label: file.name.slice(0, 150),
      }
      await uploadData({ path: asset.path, data: file, options: { contentType: file.type } }).result
      setPendingAsset(asset)
      await register(asset)
    } catch (error) {
      setMessage(error.message || 'Unable to upload photo. Please retry.')
    } finally {
      setBusy(false)
    }
  }
  if (!allowed) return null
  const text = { color: colors.foreground }
  return (
    <View style={{ gap: 12 }}>
      <Text style={[text, { fontSize: 20, fontWeight: 'bold' }]}>Photo library</Text>
      <Text style={text}>
        Removing a photo from an item keeps it here for reuse. JPEG, PNG or WebP, up to 5 MB.
      </Text>
      {Platform.OS === 'web' ? (
        createElement('input', {
          type: 'file',
          accept: 'image/jpeg,image/png,image/webp',
          disabled: busy || !!pendingAsset,
          'aria-label': 'Upload menu photo',
          onChange: (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void upload(file)
          },
          style: { color: colors.foreground, padding: 12, maxWidth: '100%' },
        })
      ) : (
        <Text style={text}>
          Open this page in your browser to upload new photos. You can select library photos here.
        </Text>
      )}
      {busy && <Text style={text}>Saving photo...</Text>}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={text}>
          {message}
        </Text>
      )}
      {pendingAsset && (
        <Pressable
          disabled={busy}
          onPress={async () => {
            setBusy(true)
            try {
              await register(pendingAsset)
            } catch {
              setMessage('Library save failed. Please retry.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <Text style={{ color: colors.primary }}>Retry saving uploaded photo to library</Text>
        </Pressable>
      )}
      {query.isError && (
        <Pressable onPress={() => query.refetch()}>
          <Text style={{ color: '#b42318' }}>Could not load photos. Tap to retry.</Text>
        </Pressable>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {(query.data?.data ?? []).map((asset) => (
          <View
            key={asset.id}
            style={{
              width: 140,
              padding: 8,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              gap: 6,
            }}
          >
            {asset.image ? (
              <Image source={asset.image} style={{ width: 122, height: 100, borderRadius: 6 }} />
            ) : (
              <Text style={text}>Preview unavailable</Text>
            )}
            <Text numberOfLines={2} style={text}>
              {asset.label}
            </Text>
            {onSelect && (
              <Pressable
                disabled={busy}
                accessibilityRole="button"
                onPress={() => onSelect(asset.id)}
                style={{ padding: 8, backgroundColor: colors.primary, borderRadius: 6 }}
              >
                <Text style={{ color: '#fff' }}>Use photo</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 20 }}>
        {tokens.length > 1 && (
          <Pressable onPress={() => setTokens((values) => values.slice(0, -1))}>
            <Text style={{ color: colors.primary }}>Previous photos</Text>
          </Pressable>
        )}
        {query.data?.nextToken && (
          <Pressable onPress={() => setTokens((values) => [...values, query.data.nextToken])}>
            <Text style={{ color: colors.primary }}>Next photos</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
