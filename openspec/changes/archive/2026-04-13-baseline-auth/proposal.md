## Why

The app currently has a minimal Firebase Google Sign-In integration (popup login, auth state listener, logout), but auth is not wired into any meaningful application flow. There is no auth gate — unauthenticated users can access every editor screen. The Settings page warns "Please login to sync" but still renders fully. There is no user document created on first sign-in, no loading/error states around auth actions, and no foundation for associating game projects with their owner. Before building any data persistence (board saves, card decks, game configs), we need a solid auth baseline that gates access, provisions user records, and provides reusable auth context to the rest of the app.

## What Changes

- Add a React auth context (`AuthProvider`) so any component can access the current user, loading state, and auth actions without prop-drilling.
- Create an auth gate that redirects unauthenticated users to a dedicated login screen instead of rendering editor UI.
- Build a login screen with Google Sign-In button, loading/error feedback, and branding consistent with the existing dark theme.
- Provision a Firestore user document (`/users/{userId}/profile`) on first sign-in, storing display name, email, photo URL, and timestamps.
- Update Firestore security rules to protect user profile documents.
- Refactor `Layout.tsx` and `App.tsx` to consume the new auth context instead of managing auth state locally.

## Capabilities

### New Capabilities
- `auth-context`: React context provider exposing current user, loading state, sign-in, and sign-out to the entire component tree.
- `login-screen`: Dedicated full-page login UI shown to unauthenticated users, with Google Sign-In and error handling.
- `user-provisioning`: Automatic creation of a Firestore user profile document on first sign-in, with idempotent writes on subsequent logins.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Code**: `src/App.tsx`, `src/components/Layout.tsx`, `src/lib/firebase.ts` will be refactored. New files: `src/contexts/AuthContext.tsx`, `src/components/LoginScreen.tsx`.
- **Firestore**: New collection path `/users/{userId}/profile`. Updated `firestore.rules`.
- **Dependencies**: No new npm packages required — uses existing Firebase SDK and React APIs.
- **UX**: Users will see a login screen instead of the editor when not authenticated. Existing authenticated flows (Settings sync) remain unchanged.
