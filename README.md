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

Amplify Gen 2 provides email/password authentication through Cognito. Customers can create an account, verify their email, resend a confirmation code, sign in, reset their password, edit their profile, and sign out. The account forms support English/Tagalog and light/dark themes.

Menu browsing remains public. Checkout requires a signed-in customer with a first name, last name, and phone number. Address is optional at signup, in the profile, and at checkout. Existing customers can complete missing details in Account. Their cart stays intact through sign-in.

### Start the authentication backend

1. Configure AWS credentials for your development account, then run `npx ampx sandbox` from the project root. This deploys the auth resource, role groups, and signup validation/role-assignment functions and generates `amplify_outputs.json`.
2. Keep the generated outputs file in the project root. `src/amplify.js` configures Amplify once before the app starts; never hand-edit the generated file or commit credentials.
3. Run `npm run web` to use the browser app. For native development, rebuild your Expo development app after installing the new native dependencies (`npx expo run:android`, or `npx expo run:ios` on macOS).

The existing Cognito pool schema is preserved. `amplify/auth/pre-sign-up/handler.ts` requires first name, last name, email, and phone number; address is optional and limited to 2,048 characters. It validates these fields on the server without changing immutable required-attribute settings or auto-verifying users. Deploy this function before relying on the server-side checks. First/last names, phone number, and address are standard Cognito attributes; email is the login identifier. Profile editing keeps email read-only. Phone numbers need a country code (for example, `+639171234567`); collecting a phone number does not verify ownership.

Amplify manages the session tokens. Passwords and verification codes stay in the form's temporary state and are not stored in Zustand or logged. Profile details are loaded from Cognito and cleared on sign-out. A failed session lookup blocks checkout and offers a retry.

`src/data/menu.js` still supplies static menu data. Checkout, order persistence, and payment processing are not implemented; the checkout button explains that no order has been placed. Existing wallet details are placeholders. When an order API is added, it must enforce authentication and ownership on the backend as well; the UI gate alone is not API authorization.

### Roles

Cognito groups represent the roles: `super_admin` (displayed as **Super admin**), `admin`, and `user`. The post-confirmation function assigns every newly confirmed signup to `user`; it ignores client-supplied role attributes/metadata and does not change memberships during password resets. Group membership is managed on the backend, and Account displays a read-only role from the Cognito token's `cognito:groups` claim. When a user belongs to multiple groups, the displayed role uses `super_admin > admin > user` precedence.

To promote an account, an authorized AWS operator can manage its groups in the Cognito user pool console. Add it to `admin` or `super_admin`, and remove any elevated groups when demoting it. The customer must sign out and back in to obtain updated token claims. Signup and profile forms never let customers choose or edit their role.

Existing accounts are not automatically backfilled into groups by deployment; assign their groups in Cognito as needed. Accounts without a recognized group display User as the least-privileged fallback; this does not create group membership or grant group-protected API access. No administrative screens or extra API permissions are introduced by defining these roles. Future backend rules must explicitly enforce the intended group permissions.

### Verify authentication

Run `npm run test:auth`, `npm run lint`, and `npx tsc --noEmit -p amplify/tsconfig.json`.

With your sandbox deployed, verify these flows using an email inbox you control:

- Create an account with names, email, phone number, and a password, leaving address blank, then confirm its email code. An empty required field or invalid phone number must be rejected. Verify that Account shows the User role.
- Try an incorrect code, resend a code, then sign in with the confirmed account.
- Reload the app and verify the session restores; edit profile details and reload again.
- Add a meal as a guest, select checkout, and sign in. The original cart should reappear.
- Reset the password using the emailed code, then sign in with the new password.
- Sign out and verify Account no longer displays the previous customer's profile.

Automated tests cover server validation, normalization, password policy, failed and expired sessions, concurrent session requests, sign-out races, and profile-update failures. They do not send real email or create AWS users.

References: [Amplify Auth setup](https://docs.amplify.aws/react-native/build-a-backend/auth/set-up-auth/) and [pre-signup attribute validation](https://docs.amplify.aws/react-native/build-a-backend/functions/examples/user-attribute-validation/).

## Code standards.

Components use arrow functions and React Native `StyleSheet` styles. Run `npm run format` before committing and `npm run format:check` in CI.
