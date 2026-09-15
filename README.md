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

### Backend (Amplify Gen 2)

The `amplify/` folder defines a starter Gen 2 backend (`auth` + `data`, see `amplify/backend.ts`). It's scaffolding only — the `Todo` model in `amplify/data/resource.ts` is a placeholder until the menu/order models are designed.

Run a personal cloud sandbox while developing locally (requires AWS credentials, see below):

```bash
npm run sandbox
```

This provisions a per-developer copy of the backend and writes `amplify_outputs.json` to the project root (gitignored). `src/lib/amplify.js` imports that file and calls `Amplify.configure()` before the app renders, so **the sandbox must be run at least once before `npm start`/`npm run web`**, or the bundler will fail to resolve the file.

## Deploying to AWS Amplify Hosting

1. **Configure AWS credentials locally** (needed for `npm run sandbox` and to let the Amplify CLI provision resources under your account):
   ```bash
   aws configure
   # or `aws configure sso` if your org uses IAM Identity Center
   ```
2. **Push this repo to GitHub/GitLab/Bitbucket/CodeCommit** if it isn't already (this repo already has a GitHub `origin`).
3. In the [AWS Amplify console](https://console.aws.amazon.com/amplify/), choose **Create new app → Host web app**, authorize access to the git provider, and select this repo/branch.
4. Amplify auto-detects `amplify.yml` at the repo root, which defines two build phases:
   - `backend`: runs `ampx pipeline-deploy` to deploy the Gen 2 backend (auth + data) for that branch and generate `amplify_outputs.json`.
   - `frontend`: runs `npx expo export -p web` and publishes the static `dist/` output.
5. Click **Save and deploy**. Amplify creates an IAM service role, deploys the backend, builds the web export, and hosts it on a `*.amplifyapp.com` URL (a custom domain can be attached afterward under **Domain management**).
6. Every subsequent push to the connected branch redeploys both the backend and frontend automatically.

Native builds (iOS/Android) are not part of Amplify Hosting — those still go through EAS Build or a manual `expo run:android`/`expo run:ios` release pipeline.

## Code standards.

Components use arrow functions and React Native `StyleSheet` styles. Run `npm run format` before committing and `npm run format:check` in CI.
