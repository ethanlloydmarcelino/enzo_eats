import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { dataClient, throwOnErrors } from '../../src/orders/client'
const decode = (result) => {
  const value = throwOnErrors(result)
  return typeof value === 'string' ? JSON.parse(value) : value
}
export default function Users() {
  const { role, status, user: actor } = useAuthStore()
  const allowed = status === 'signedIn' && role === 'super_admin'
  const colors = useColors(useThemeStore((s) => s.theme))
  const cache = useQueryClient()
  const [search, setSearch] = useState('')
  const [prefix, setPrefix] = useState('')
  const [tokens, setTokens] = useState([undefined])
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const query = useQuery({
    queryKey: ['admin-users', actor?.userId, role, prefix, tokens.at(-1)],
    enabled: allowed,
    queryFn: async () =>
      decode(
        await dataClient.queries.listAccountUsers({
          emailPrefix: prefix,
          nextToken: tokens.at(-1),
        }),
      ),
  })
  useEffect(() => {
    if (status === 'signedIn' && !allowed) router.replace('/account')
  }, [status, allowed])
  const text = { color: colors.foreground }
  const button = { padding: 12, borderRadius: 8, backgroundColor: colors.primary }
  const change = async () => {
    setBusy(true)
    setMessage('')
    try {
      await decode(
        await dataClient.mutations.changeUserRole({
          username: pending.user.username,
          role: pending.role,
        }),
      )
      setPending(null)
      setMessage('Role saved. The user should sign out and sign back in to use their new role.')
      await cache.invalidateQueries({ queryKey: ['admin-users'] })
    } catch {
      setMessage(
        'Could not change the role. Refresh the list and check your permissions before retrying.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <AccountScreen title="Users & roles" subtitle="Manage customer and administrator access">
      {allowed && (
        <>
          <Text style={text}>
            Only super admins can view users or change roles. Your own role cannot be changed here.
          </Text>
          <TextInput
            accessibilityLabel="Search email prefix"
            value={search}
            onChangeText={setSearch}
            placeholder="Email starts with..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            maxLength={254}
            style={{
              ...text,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              marginVertical: 12,
            }}
          />
          <Pressable
            accessibilityRole="button"
            style={button}
            onPress={() => {
              setPrefix(search.trim())
              setTokens([undefined])
              setPending(null)
            }}
          >
            <Text style={{ color: '#fff' }}>Search users</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
            <Text style={{ color: colors.primary, padding: 12 }}>Refresh</Text>
          </Pressable>
          {!!message && (
            <Text accessibilityLiveRegion="polite" style={text}>
              {message}
            </Text>
          )}
          {query.isPending && <ActivityIndicator color={colors.primary} />}
          {query.isError && (
            <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
              Could not load users. Please refresh to retry.
            </Text>
          )}
          {pending && (
            <View
              style={{
                padding: 16,
                gap: 12,
                borderWidth: 1,
                borderColor: colors.primary,
                marginVertical: 12,
              }}
            >
              <Text style={text}>
                Change {pending.user.email || pending.user.username} from {pending.user.role} to{' '}
                {pending.role}?
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void change()}
                style={button}
              >
                <Text style={{ color: '#fff' }}>{busy ? 'Saving...' : 'Confirm role change'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setPending(null)}
              >
                <Text style={text}>Cancel</Text>
              </Pressable>
            </View>
          )}
          {(query.data?.users ?? []).map((user) => (
            <View
              key={user.username}
              style={{
                padding: 16,
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
                marginVertical: 8,
                borderRadius: 12,
              }}
            >
              <Text style={[text, { fontWeight: 'bold' }]}>
                {user.firstName} {user.lastName}
              </Text>
              <Text selectable style={text}>
                {user.email || user.username}
              </Text>
              <Text style={text}>
                Role: {user.role} | Status: {user.status} | {user.enabled ? 'Enabled' : 'Disabled'}
              </Text>
              {actor?.userId !== user.id &&
                (role === 'super_admin' || user.role !== 'super_admin') && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(role === 'super_admin' ? ['user', 'admin', 'super_admin'] : ['user', 'admin'])
                      .filter((next) => next !== user.role)
                      .map((next) => (
                        <Pressable
                          key={next}
                          accessibilityRole="button"
                          disabled={busy}
                          style={button}
                          onPress={() => {
                            setMessage('')
                            setPending({ user, role: next })
                          }}
                        >
                          <Text style={{ color: '#fff' }}>Make {next.replace('_', ' ')}</Text>
                        </Pressable>
                      ))}
                  </View>
                )}
            </View>
          ))}
          {!query.isPending && !query.isError && !query.data?.users?.length && (
            <Text style={text}>No users on this page.</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
            {tokens.length > 1 && (
              <Pressable
                accessibilityRole="button"
                style={button}
                onPress={() => {
                  setTokens((values) => values.slice(0, -1))
                  setPending(null)
                }}
              >
                <Text style={{ color: '#fff' }}>Previous</Text>
              </Pressable>
            )}
            {!!query.data?.nextToken && (
              <Pressable
                accessibilityRole="button"
                style={button}
                onPress={() => {
                  setTokens((values) => [...values, query.data.nextToken])
                  setPending(null)
                }}
              >
                <Text style={{ color: '#fff' }}>Next users</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </AccountScreen>
  )
}
