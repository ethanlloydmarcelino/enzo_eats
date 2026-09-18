import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Context, PreSignUpTriggerEvent, PostConfirmationTriggerEvent } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { handler as assignRole } from '../amplify/auth/post-confirmation/handler'
import { roleFromGroups } from '../src/auth/roles'
import { handler } from '../amplify/auth/pre-sign-up/handler'
import { createAuthStore } from '../src/auth/createAuthStore'
import { passwordIsValid, profileAttributes, profileError } from '../src/auth/validation'

const attributes = {
  given_name: 'Maria',
  family_name: 'Santos',
  email: 'maria@example.com',
  phone_number: '+639171234567',
  address: '12 Example Street, Manila 1000',
}
const eventWith = (values: Record<string, string>) =>
  ({
    version: '1',
    region: 'ap-southeast-1',
    userPoolId: 'pool',
    userName: 'user',
    callerContext: { awsSdkVersion: 'test', clientId: 'client' },
    triggerSource: 'PreSignUp_SignUp',
    request: { userAttributes: values },
    response: { autoConfirmUser: false, autoVerifyEmail: false, autoVerifyPhone: false },
  }) as PreSignUpTriggerEvent
const validate = (event: PreSignUpTriggerEvent) => handler(event, {} as Context, () => {})
const user = { userId: 'customer-1', username: 'customer-1' }
const sdk = (overrides = {}) => ({
  getCurrentUser: async () => user,
  fetchUserAttributes: async () => attributes,
  fetchAuthSession: async () => ({
    tokens: { accessToken: { payload: { 'cognito:groups': ['user'] } } },
  }),
  updateUserAttributes: async () => ({}),
  signOut: async () => {},
  ...overrides,
})

test('signup requires names, email, and phone on the server, including whitespace-only and oversized input', async () => {
  for (const key of ['given_name', 'family_name', 'email', 'phone_number']) {
    for (const value of ['', '  ', 'a'.repeat(2049)]) {
      await assert.rejects(
        async () => validate(eventWith({ ...attributes, [key]: value })),
        /required/,
      )
    }
    const missing = { ...attributes }
    delete missing[key as keyof typeof missing]
    await assert.rejects(async () => validate(eventWith(missing)), /required/)
  }
})

test('valid signup still requires Cognito email confirmation', async () => {
  const event = eventWith(attributes)
  const result = await validate(event)
  assert.equal(result, event)
  assert.equal(result?.response.autoConfirmUser, false)
  assert.equal(result?.response.autoVerifyEmail, false)
  assert.equal(result?.response.autoVerifyPhone, false)
})

test('phone validation rejects local numbers, letters, and invalid international formats', async () => {
  for (const phone_number of [
    '09171234567',
    '+01234567',
    '+63917abc',
    '+1234567890123456',
    '+6',
    '+63 917 1234567',
  ]) {
    await assert.rejects(
      async () => validate(eventWith({ ...attributes, phone_number })),
      /country code/,
    )
  }
})

test('form values map to Cognito attributes and normalize phone formatting without inventing a country code', () => {
  const result = profileAttributes({
    firstName: ' Maria ',
    lastName: ' Santos ',
    phoneNumber: '+63 (917) 123-4567',
    address: ' 12 Example Street ',
  })
  assert.deepEqual(result, {
    given_name: 'Maria',
    family_name: 'Santos',
    phone_number: '+639171234567',
    address: '12 Example Street',
  })
  assert.equal(profileError(result), null)
  assert.equal(profileError(profileAttributes({})), 'authRequiredFields')
  assert.equal(profileError({ ...result, phone_number: '09171234567' }), 'authInvalidPhone')
})

test('password validation follows the configured Cognito policy', () => {
  const policy = {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: true,
  }
  assert.equal(passwordIsValid('Example1!', policy), true)
  for (const password of ['Ab1!', 'example1!', 'EXAMPLE1!', 'Example!!', 'Example12']) {
    assert.equal(passwordIsValid(password, policy), false)
  }
})

test('restores authenticated session and profile together', async () => {
  const store = createAuthStore(sdk())
  assert.equal(store.getState().status, 'loading')
  assert.equal(await store.getState().refreshSession(), true)
  assert.equal(store.getState().status, 'signedIn')
  assert.deepEqual(store.getState().attributes, attributes)
})

test('a network error fails closed and can be retried', async () => {
  let offline = true
  const store = createAuthStore(
    sdk({
      fetchUserAttributes: async () => {
        if (offline) throw new Error('Offline')
        return attributes
      },
    }),
  )
  assert.equal(await store.getState().refreshSession(), false)
  assert.equal(store.getState().status, 'error')
  assert.equal(store.getState().user, null)
  offline = false
  assert.equal(await store.getState().refreshSession(), true)
  assert.equal(store.getState().sessionError, false)
})

test('missing or expired credentials produce a signed-out session', async () => {
  for (const name of ['UserUnAuthenticatedException', 'NotAuthorizedException']) {
    const store = createAuthStore(
      sdk({
        getCurrentUser: async () => {
          throw Object.assign(new Error(), { name })
        },
      }),
    )
    await store.getState().refreshSession()
    assert.equal(store.getState().status, 'signedOut')
    assert.equal(store.getState().sessionError, false)
  }
})

test('late profile requests cannot restore a session after sign-out', async () => {
  let resolveProfile!: ReturnType<typeof Promise.withResolvers<typeof attributes>>['resolve']
  const store = createAuthStore(
    sdk({
      fetchUserAttributes: () =>
        new Promise((resolve) => {
          resolveProfile = resolve
        }),
    }),
  )
  const refreshing = store.getState().refreshSession()
  await Promise.resolve()
  await store.getState().logOut()
  resolveProfile(attributes)
  assert.equal(await refreshing, false)
  assert.equal(store.getState().status, 'signedOut')
  assert.equal(store.getState().attributes, null)
  assert.equal(store.getState().role, null)
})

test('latest session refresh wins over older requests', async () => {
  let resolveOld!: ReturnType<typeof Promise.withResolvers<typeof attributes>>['resolve']
  let calls = 0
  const latest = { ...attributes, given_name: 'Updated' }
  const store = createAuthStore(
    sdk({
      fetchUserAttributes: () =>
        ++calls === 1
          ? new Promise((resolve) => {
              resolveOld = resolve
            })
          : Promise.resolve(latest),
    }),
  )
  const old = store.getState().refreshSession()
  await Promise.resolve()
  await store.getState().refreshSession()
  resolveOld(attributes)
  await old
  assert.equal(store.getState().attributes.given_name, 'Updated')
})

test('checkout intent remains until account closes, and signing out clears profile data', async () => {
  const store = createAuthStore(sdk())
  store.getState().openAccount(true)
  await store.getState().refreshSession()
  assert.equal(store.getState().returnToCart, true)
  store.getState().closeAccount()
  assert.equal(store.getState().returnToCart, false)
  assert.equal(store.getState().accountOpen, false)
  await store.getState().logOut()
  assert.equal(store.getState().user, null)
  assert.equal(store.getState().attributes, null)
})

test('profile update failures propagate without pretending the profile was saved', async () => {
  const store = createAuthStore(
    sdk({
      updateUserAttributes: async () => {
        throw new Error('Offline')
      },
    }),
  )
  await store.getState().refreshSession()
  await assert.rejects(() => store.getState().saveProfile({ given_name: 'Changed' }), /Offline/)
  assert.equal(store.getState().attributes.given_name, 'Maria')
})

test('address is optional for signup, profile updates, and checkout validation', async () => {
  const { address: _address, ...withoutAddress } = attributes
  for (const candidate of [
    withoutAddress,
    { ...withoutAddress, address: '' },
    { ...withoutAddress, address: '  ' },
  ]) {
    await validate(eventWith(candidate))
    assert.equal(profileError(candidate), null)
  }
  await assert.rejects(
    async () => validate(eventWith({ ...attributes, address: 'a'.repeat(2049) })),
    /Address/,
  )
  assert.equal(profileError({ ...attributes, address: 'a'.repeat(2049) }), 'authAddressTooLong')
})

const confirmedEvent = (
  triggerSource: PostConfirmationTriggerEvent['triggerSource'] = 'PostConfirmation_ConfirmSignUp',
): PostConfirmationTriggerEvent => ({
  version: '1',
  region: 'ap-southeast-1',
  userPoolId: 'pool',
  userName: 'new-user',
  callerContext: { awsSdkVersion: 'test', clientId: 'client' },
  triggerSource,
  request: {
    userAttributes: { ...attributes, 'custom:role': 'super_admin' },
    clientMetadata: { role: 'admin' },
  },
  response: {},
})

test('confirmed signup always assigns user, ignoring client role claims, and permits safe retries', async (context) => {
  const send = context.mock.method(
    CognitoIdentityProviderClient.prototype,
    'send',
    async () => ({}),
  )
  const event = confirmedEvent()
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal(await assignRole(event, {} as Context, () => {}), event)
  }
  assert.equal(send.mock.callCount(), 2)
  for (const call of send.mock.calls) {
    const command = call.arguments[0]
    assert.ok(command instanceof AdminAddUserToGroupCommand)
    assert.deepEqual(command.input, { UserPoolId: 'pool', Username: 'new-user', GroupName: 'user' })
  }
})

test('password confirmation never changes a user role', async (context) => {
  const send = context.mock.method(
    CognitoIdentityProviderClient.prototype,
    'send',
    async () => ({}),
  )
  const event = confirmedEvent('PostConfirmation_ConfirmForgotPassword')
  assert.equal(await assignRole(event, {} as Context, () => {}), event)
  assert.equal(send.mock.callCount(), 0)
})

test('role assignment failures propagate instead of reporting success', async (context) => {
  context.mock.method(CognitoIdentityProviderClient.prototype, 'send', async () => {
    throw new Error('Access denied')
  })
  await assert.rejects(
    async () => assignRole(confirmedEvent(), {} as Context, () => {}),
    /Access denied/,
  )
})

test('roles use known Cognito groups with super admin taking precedence', () => {
  assert.equal(roleFromGroups(['user']), 'user')
  assert.equal(roleFromGroups(['user', 'admin']), 'admin')
  assert.equal(roleFromGroups(['admin', 'super_admin', 'user']), 'super_admin')
  assert.equal(roleFromGroups(['unknown']), 'user')
  assert.equal(roleFromGroups(undefined), 'user')
  assert.equal(roleFromGroups('super_admin'), 'user')
})

test('session role comes from Cognito token groups, never editable attributes', async () => {
  const store = createAuthStore(
    sdk({
      fetchUserAttributes: async () => ({ ...attributes, 'custom:role': 'super_admin' }),
    }),
  )
  await store.getState().refreshSession()
  assert.equal(store.getState().role, 'user')
  const adminStore = createAuthStore(
    sdk({
      fetchAuthSession: async () => ({
        tokens: { accessToken: { payload: { 'cognito:groups': ['admin'] } } },
      }),
    }),
  )
  await adminStore.getState().refreshSession()
  assert.equal(adminStore.getState().role, 'admin')
  await adminStore.getState().logOut()
  assert.equal(adminStore.getState().role, null)
})
