import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

/**
 * Starter schema. Replace `Todo` with the real menu/order models when wiring
 * `fetchMenu()` (see src/data/menu.js) to Amplify Data — the React Query
 * consumer in src/components/MenuSection.jsx can stay unchanged.
 * https://docs.amplify.aws/react-native/build-a-backend/data/
 */
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    // Anonymous/public access to start, since the storefront has no sign-in
    // yet. Add `userPool` as the default once auth is required.
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
})
