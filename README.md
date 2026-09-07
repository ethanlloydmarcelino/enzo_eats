# Enzo Eats

A responsive personal meal-ordering frontend built with React, Vite, Tailwind CSS, shadcn-ui/Radix primitives, Zustand, TanStack React Query, and Lucide icons.

The header includes a persistent light/dark theme toggle. It follows the device preference on first visit, then remembers the user's explicit choice in local storage.

## Run locally

```bash
npm install
npm run dev
```

## Amplify handoff

The current menu is returned by `src/data/menu.js`. Replace `fetchMenu()` with your Amplify Data client call; the React Query consumer in `src/components/MenuSection.jsx` can remain unchanged. Cart, favorites, and pickup/delivery state live in `src/store/useOrderStore.js` and can later be hydrated from an authenticated Amplify user.

The checkout button is intentionally frontend-only until payment and order creation are connected.

## Code standards

Components and utilities use arrow functions. Run `npm run format` before committing and `npm run format:check` in CI. Interactive shadcn components use Radix UI primitives with Tailwind CSS styling.
