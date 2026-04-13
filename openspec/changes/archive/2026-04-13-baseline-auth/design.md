## Context

The GameCraft Editor is a React 19 + Vite + Firebase SPA for designing board games. Auth currently lives as local state in `App.tsx` — a `useState<User | null>` fed by `onAuthStateChanged`. The `user` object is prop-drilled through `Layout` and into `Settings`. There is no auth gate: all screens render regardless of login state. The only Firestore interaction is the user settings document at `/users/{userId}/settings/preferences`.

## Goals / Non-Goals

**Goals:**
- Centralize auth state in a React context so any component can consume it without prop-drilling.
- Gate the entire editor behind authentication — unauthenticated users see only a login screen.
- Automatically provision a user profile document in Firestore on first sign-in.
- Maintain the existing dark-theme visual language for the login screen.

**Non-Goals:**
- Multiple auth providers (email/password, GitHub, etc.) — Google-only for now.
- Role-based access control or team/org concepts.
- User profile editing UI.
- Migrating the existing Settings Firestore integration — it continues to work as-is.
- Offline-first or anonymous auth.

## Decisions

### 1. React Context for auth state

**Choice**: Single `AuthProvider` context wrapping the app, exposing `{ user, loading, signIn, signOut }`.

**Alternatives considered**:
- **Keep prop-drilling**: Already painful at 2 levels deep (App → Layout → Settings). Adding more consumers (future: project list, share dialog) would make it worse.
- **Zustand/external store**: Unnecessary complexity for a single piece of global state that maps 1:1 to a Firebase listener.

**Rationale**: Context is the idiomatic React solution. The auth state changes infrequently (login/logout), so re-render cost is negligible.

### 2. Auth gate at the App level

**Choice**: `App.tsx` renders either `<LoginScreen />` or `<Layout>...</Layout>` based on `user` from context. No client-side routing library.

**Alternatives considered**:
- **React Router with protected routes**: The app currently uses a simple `activeScreen` state machine, not a router. Introducing react-router just for an auth gate is disproportionate.
- **Per-component guards**: Scattered, error-prone, easy to forget on new screens.

**Rationale**: A single top-level conditional is the simplest approach that matches the existing routing pattern.

### 3. User profile provisioning on sign-in

**Choice**: After `signInWithPopup` resolves, check if `/users/{userId}/profile` exists. If not, create it with `setDoc`. Use `{ merge: true }` to make the write idempotent — safe to call on every login to update `lastLoginAt`.

**Alternatives considered**:
- **Cloud Function trigger on `auth.user().onCreate`**: More robust but requires Firebase Functions setup (not currently in the project). Overkill for a profile stub.
- **Create on first Firestore write**: Delays provisioning until user performs an action, leaving a window where the profile doesn't exist.

**Rationale**: Client-side provisioning is immediate, requires no infrastructure changes, and the `merge: true` pattern handles repeat logins gracefully.

### 4. Firestore document structure

**Choice**: `/users/{userId}/profile` as a single document (not a subcollection). Fields: `displayName`, `email`, `photoURL`, `createdAt`, `lastLoginAt`.

**Rationale**: Flat document avoids unnecessary subcollection nesting. Mirrors Firebase Auth user record fields. `createdAt` uses server timestamp on first write only; `lastLoginAt` updates each login.

## Risks / Trade-offs

- **[Popup blockers]** → Google sign-in uses `signInWithPopup`, which can be blocked by aggressive browser settings. Mitigation: existing code already handles `auth/popup-closed-by-user`. A future enhancement could add `signInWithRedirect` as fallback, but that's out of scope.
- **[Race condition on provisioning]** → If the user opens multiple tabs simultaneously on first login, two `setDoc` calls with `merge: true` could race. Mitigation: Both writes are idempotent (same data), so the result is correct regardless of ordering. `createdAt` should use `serverTimestamp()` only on the initial create to avoid overwrite.
- **[No loading skeleton]** → During the initial `onAuthStateChanged` check, the app shows a spinner. This is brief (< 1s typically) and acceptable for now.
