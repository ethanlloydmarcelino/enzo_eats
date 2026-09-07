# Enzo Eats

A cross-platform meal-ordering app built with React Native, Expo, Metro, Zustand, TanStack React Query, and Lucide icons. It runs on Android, iOS, and the web from one codebase.

The app includes responsive native layouts, menu search and filtering, favorites, pickup ordering, a cart modal, persistent English/Tagalog language selection, and a persistent light/dark theme.

## Run locally

```bash
npm install
npm start
```

Use `npm run android`, `npm run ios`, or `npm run web` to open a specific platform. Metro is started by Expo automatically.

For native libraries such as AWS Amplify, use an Expo development build rather than Expo Go:

```bash
npx expo install expo-dev-client
npx expo run:android
# or, on macOS: npx expo run:ios
```

## Amplify handoff

The current menu is returned by `src/data/menu.js`. Replace `fetchMenu()` with an Amplify Data client call; the React Query consumer in `src/components/MenuSection.jsx` can remain unchanged. Cart and favorites state live in `src/store/useOrderStore.js` and can later be hydrated from an authenticated Amplify user.

The checkout button is intentionally frontend-only until payment and order creation are connected.

## Code standards

Components use arrow functions and React Native `StyleSheet` styles. Run `npm run format` before committing and `npm run format:check` in CI.
