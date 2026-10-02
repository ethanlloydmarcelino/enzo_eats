import { createElement, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, ImagePlus, Check } from 'lucide-react-native'
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native'
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
  const [selection, setSelection] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => {
    const url = selection?.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [selection])
  const choose = async (file) => {
    if (!file) return
    setSelecting(true)
    setMessage('')
    try {
      checkImage(file.type, file.size, new Uint8Array(await file.slice(0, 12).arrayBuffer()))
      setSelection({ file, url: URL.createObjectURL(file) })
    } catch (error) {
      setMessage(error.message || 'Unable to read this photo. Please choose another.')
    } finally {
      setSelecting(false)
    }
  }
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
    setSelection(null)
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
        <View
          style={{
            padding: 20,
            gap: 16,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            backgroundColor: colors.card,
          }}
        >
          {createElement('input', {
            ref: inputRef,
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp',
            disabled: busy || selecting || !!pendingAsset,
            tabIndex: -1,
            'aria-label': 'Choose menu photo',
            onChange: (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void choose(file)
            },
            style: { display: 'none' },
          })}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.muted }}>
              <ImagePlus size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[text, { fontSize: 17, fontWeight: 'bold' }]}>
                {selection ? 'Review your photo' : 'Add a new photo'}
              </Text>
              <Text style={{ color: colors.mutedForeground }}>
                {selection
                  ? 'Check the preview, then save it to your library.'
                  : 'Choose a photo, preview it, then save it to your library.'}
              </Text>
            </View>
          </View>
          {selection && (
            <View style={{ gap: 8 }}>
              <Image
                accessibilityLabel="Selected photo preview"
                source={{ uri: selection.url }}
                resizeMode="contain"
                style={{
                  width: '100%',
                  height: 220,
                  borderRadius: 12,
                  backgroundColor: colors.muted,
                }}
              />
              <Text numberOfLines={2} style={text}>
                {selection.file.name}
              </Text>
              <Text style={{ color: colors.mutedForeground }}>
                {(selection.file.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              disabled={busy || selecting || !!pendingAsset}
              onPress={() => (selection ? upload(selection.file) : inputRef.current?.click())}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 13,
                paddingHorizontal: 18,
                borderRadius: 10,
                backgroundColor: colors.primary,
                opacity: busy || selecting || pendingAsset ? 0.5 : 1,
              }}
            >
              {busy || selecting ? (
                <ActivityIndicator color="#fff" />
              ) : selection ? (
                <Check size={18} color="#fff" />
              ) : (
                <Upload size={18} color="#fff" />
              )}
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {busy
                  ? 'Saving photo...'
                  : selecting
                    ? 'Preparing preview...'
                    : selection
                      ? onSelect
                        ? 'Save & use photo'
                        : 'Save to library'
                      : 'Upload photo'}
              </Text>
            </Pressable>
            {selection && !pendingAsset && (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy || selecting}
                  onPress={() => inputRef.current?.click()}
                  style={{ padding: 13 }}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Choose another</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy || selecting}
                  onPress={() => {
                    setSelection(null)
                    setMessage('')
                  }}
                  style={{ padding: 13 }}
                >
                  <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : (
        <Text style={text}>
          Open this page in your browser to upload new photos. You can select library photos here.
        </Text>
      )}
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
      <Text style={[text, { fontSize: 17, fontWeight: 'bold', marginTop: 8 }]}>
        {onSelect ? 'Or choose from your library' : 'Saved photos'}
      </Text>
      {query.isPending && (
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading photos" />
      )}
      {!query.isPending && !query.isError && !query.data?.data?.length && (
        <Text style={{ color: colors.mutedForeground }}>Your saved photos will appear here.</Text>
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
