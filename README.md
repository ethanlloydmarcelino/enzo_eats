# Enzo Eats

A cross-platform meal-ordering app built with React Native, Expo, Metro, Zustand, TanStack React Query, and Lucide icons. It runs on Android, iOS, and the web from one codebase.

The app includes responsive native layouts, menu search and filtering, favorites, pickup ordering, a cart modal, persistent English/Tagalog language selection, and a persistent light/dark theme.

## Run locally

```bash
npm install
npm start
```

Use `npm run android`, `npm run ios`, or `npm run web` to open a specific platform. Metro is started by Expo automatically.

## Backend

There's no backend yet. `src/data/menu.js` returns the menu from static data, and the checkout button is intentionally frontend-only until a backend (order creation, payment, persistence) is designed and connected.

## Code standards.

Components use arrow functions and React Native `StyleSheet` styles. Run `npm run format` before committing and `npm run format:check` in CI.
