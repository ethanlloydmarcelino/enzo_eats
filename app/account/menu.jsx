import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Image, Pressable, Switch, Text, TextInput, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { MenuImageLibrary } from '../../src/components/account/MenuImageLibrary'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { dataClient, throwOnErrors, listAll } from '../../src/orders/client'
import { imageForRecord } from '../../src/data/menu'

const blank = {
  name: '',
  nameTl: '',
  description: '',
  descriptionTl: '',
  price: '',
  category: 'food',
  visible: true,
  available: true,
  optionsText: '',
  imageAssetId: null,
}
const call = async (action, input) =>
  throwOnErrors(
    await dataClient.mutations.manageMenu({
      action,
      input: input ? JSON.stringify(input) : undefined,
    }),
  )
export default function ManageMenu() {
  const { user, role, status } = useAuthStore()
  const allowed = status === 'signedIn' && ['admin', 'super_admin'].includes(role)
  const colors = useColors(useThemeStore((state) => state.theme))
  const cache = useQueryClient()
  const [form, setForm] = useState(null)
  const [library, setLibrary] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const query = useQuery({
    queryKey: ['admin-menu', user?.userId, role],
    enabled: allowed,
    queryFn: async () => {
      await call('INITIALIZE')
      const items = await listAll((nextToken) =>
        dataClient.models.MenuItem.list({ nextToken, filter: { deleted: { eq: false } } }),
      )
      return items.sort((a, b) => Number(a.id) - Number(b.id))
    },
  })
  const preview = useQuery({
    queryKey: ['menu-preview', form?.imageAssetId, user?.userId],
    enabled: allowed && !!form?.imageAssetId,
    queryFn: async () =>
      imageForRecord(
        throwOnErrors(await dataClient.models.MenuImage.get({ id: form.imageAssetId })),
      ),
  })
  useEffect(() => {
    if (status === 'signedIn' && !allowed) router.replace('/account')
  }, [status, allowed])
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['menu'] }),
      cache.invalidateQueries({ queryKey: ['admin-menu'] }),
    ])
  }
  const save = async (item, action = 'SAVE') => {
    if (!allowed || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const input =
        action === 'DELETE'
          ? { id: item.id, updatedAt: item.updatedAt }
          : {
              ...item,
              price: Number(item.price),
              options:
                item.optionsText !== undefined
                  ? item.optionsText
                      .split('\n')
                      .map((value) => value.trim())
                      .filter(Boolean)
                  : item.options || [],
            }
      await call(action, input)
      setForm(null)
      setDeleteId(null)
      setLibrary(false)
      setNotice(
        action === 'DELETE'
          ? 'Menu item deleted. Its photos remain in the library.'
          : 'Menu saved.',
      )
      await refresh()
    } catch (cause) {
      setError(
        cause.message?.includes('MENU_CHANGED_REFRESH')
          ? 'Another admin changed this item. Close the editor and refresh before trying again.'
          : 'Could not save. Check the name, price, photo and options, then retry. ' +
              (cause.message || ''),
      )
    } finally {
      setBusy(false)
    }
  }
  const text = { color: colors.foreground }
  const button = { padding: 12, borderRadius: 8, backgroundColor: colors.primary }
  const field = (key, label, multiline = false) => (
    <View style={{ gap: 5 }}>
      <Text style={text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={String(form[key] ?? '')}
        onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
        editable={!busy}
        multiline={multiline}
        keyboardType={key === 'price' ? 'decimal-pad' : 'default'}
        maxLength={multiline ? 1200 : 100}
        style={{
          ...text,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          minHeight: multiline ? 80 : 48,
        }}
      />
    </View>
  )
  return (
    <AccountScreen
      key={form ? 'editor' : 'list'}
      title="Manage menu & photos"
      subtitle="Prices, photos and availability"
    >
      {allowed && (
        <View style={{ gap: 16 }}>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              {error}
            </Text>
          )}
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={text}>
              {notice}
            </Text>
          )}
          {form ? (
            <>
              <Text style={[text, { fontSize: 22, fontWeight: 'bold' }]}>
                {form.id ? 'Edit menu item' : 'Add menu item'}
              </Text>
              {field('name', 'Name (required)')}
              {field('description', 'Description', true)}
              {field('price', 'Price in pesos (required)')}
              {field('nameTl', 'Tagalog name (optional)')}
              {field('descriptionTl', 'Tagalog description (optional)', true)}
              <Text style={text}>Category</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {['food', 'drink'].map((category) => (
                  <Pressable
                    key={category}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.category === category }}
                    onPress={() => setForm((current) => ({ ...current, category }))}
                    style={{ ...button, opacity: form.category === category ? 1 : 0.5 }}
                  >
                    <Text style={{ color: '#fff' }}>{category === 'food' ? 'Food' : 'Drink'}</Text>
                  </Pressable>
                ))}
              </View>
              {field('optionsText', 'Flavor choices (one per line, optional)', true)}
              {[
                ['visible', 'Show on menu'],
                ['available', 'Available to order'],
              ].map(([key, label]) => (
                <View
                  key={key}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={text}>{label}</Text>
                  <Switch
                    accessibilityLabel={label}
                    disabled={busy}
                    value={form[key]}
                    onValueChange={(value) => setForm((current) => ({ ...current, [key]: value }))}
                  />
                </View>
              ))}
              <Text style={text}>
                Hidden items are not shown to customers. Unavailable items remain visible but cannot
                be ordered.
              </Text>
              {form.imageAssetId && preview.data ? (
                <Image
                  source={preview.data}
                  style={{ width: '100%', height: 220, borderRadius: 12 }}
                />
              ) : (
                <Text style={text}>No photo selected</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <Pressable disabled={busy} onPress={() => setLibrary(!library)} style={button}>
                  <Text style={{ color: '#fff' }}>
                    {library ? 'Close library' : 'Choose or upload photo'}
                  </Text>
                </Pressable>
                {!!form.imageAssetId && (
                  <Pressable
                    disabled={busy}
                    onPress={() => setForm((current) => ({ ...current, imageAssetId: null }))}
                    style={{ padding: 12 }}
                  >
                    <Text style={{ color: '#b42318' }}>Remove from item (keep in library)</Text>
                  </Pressable>
                )}
              </View>
              {library && (
                <MenuImageLibrary
                  colors={colors}
                  onSelect={(imageAssetId) => {
                    setForm((current) => ({ ...current, imageAssetId }))
                    setLibrary(false)
                  }}
                />
              )}
              <Pressable
                disabled={busy || !form.name.trim() || !(Number(form.price) > 0)}
                onPress={() => save(form)}
                style={button}
              >
                <Text style={{ color: '#fff' }}>{busy ? 'Saving...' : 'Save menu item'}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => {
                  setForm(null)
                  setLibrary(false)
                  setError('')
                }}
              >
                <Text style={text}>Cancel editing</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => {
                    setForm({ ...blank })
                    setLibrary(false)
                    setError('')
                    setNotice('')
                  }}
                  style={button}
                >
                  <Text style={{ color: '#fff' }}>Add menu item</Text>
                </Pressable>
                <Pressable onPress={() => setLibrary(!library)} style={button}>
                  <Text style={{ color: '#fff' }}>
                    {library ? 'Show menu items' : 'Photo library'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => query.refetch()} style={{ padding: 12 }}>
                  <Text style={{ color: colors.primary }}>Refresh</Text>
                </Pressable>
              </View>
              {library ? (
                <MenuImageLibrary colors={colors} />
              ) : (
                <>
                  {query.isPending && <ActivityIndicator color={colors.primary} />}
                  {query.isError && (
                    <Text style={{ color: '#b42318' }}>
                      Unable to load the menu. Tap Refresh to retry.
                    </Text>
                  )}
                  {(query.data ?? []).map((item) => (
                    <View
                      key={item.id}
                      style={{
                        gap: 10,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={[text, { fontSize: 18, fontWeight: 'bold' }]}>{item.name}</Text>
                      <Text style={text}>
                        PHP {Number(item.price).toFixed(2)} | {item.visible ? 'Shown' : 'Hidden'} |{' '}
                        {item.available ? 'Available' : 'Unavailable'}
                      </Text>
                      <Text style={text}>{item.description}</Text>
                      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                        <Pressable
                          disabled={busy}
                          onPress={() => {
                            setForm({
                              ...item,
                              price: String(item.price),
                              optionsText: (item.options || []).join('\n'),
                            })
                            setError('')
                            setNotice('')
                          }}
                          style={button}
                        >
                          <Text style={{ color: '#fff' }}>Edit</Text>
                        </Pressable>
                        <Pressable
                          disabled={busy}
                          onPress={() => save({ ...item, visible: !item.visible })}
                          style={button}
                        >
                          <Text style={{ color: '#fff' }}>{item.visible ? 'Hide' : 'Show'}</Text>
                        </Pressable>
                        <Pressable
                          disabled={busy}
                          onPress={() => save({ ...item, available: !item.available })}
                          style={button}
                        >
                          <Text style={{ color: '#fff' }}>
                            {item.available ? 'Mark unavailable' : 'Mark available'}
                          </Text>
                        </Pressable>
                        <Pressable
                          disabled={busy}
                          onPress={() => setDeleteId(item.id)}
                          style={{ padding: 12 }}
                        >
                          <Text style={{ color: '#b42318' }}>Delete item</Text>
                        </Pressable>
                      </View>
                      {deleteId === item.id && (
                        <View style={{ gap: 10 }}>
                          <Text style={text}>
                            Delete {item.name} from the menu? Its photos and historical receipts
                            will be kept.
                          </Text>
                          <Pressable
                            disabled={busy}
                            onPress={() => save(item, 'DELETE')}
                            style={{ ...button, backgroundColor: '#b42318' }}
                          >
                            <Text style={{ color: '#fff' }}>Confirm delete item</Text>
                          </Pressable>
                          <Pressable disabled={busy} onPress={() => setDeleteId(null)}>
                            <Text style={text}>Keep item</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}
    </AccountScreen>
  )
}
