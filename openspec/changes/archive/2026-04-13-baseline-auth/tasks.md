## 1. Auth Context

- [x] 1.1 Create `src/contexts/AuthContext.tsx` with `AuthProvider` and `useAuth` hook — wraps `onAuthStateChanged`, exposes `{ user, loading, signIn, signOut }`
- [x] 1.2 Wrap the app root in `<AuthProvider>` in `src/main.tsx`
- [x] 1.3 Remove auth state management (`useState<User>`, `useEffect` with `onAuthStateChanged`) from `App.tsx` — consume `useAuth()` instead
- [x] 1.4 Remove `user` prop-drilling from `Layout.tsx` — consume `useAuth()` directly

## 2. Login Screen

- [x] 2.1 Create `src/components/LoginScreen.tsx` — full-page login with Google Sign-In button, loading state, and error feedback, using the existing dark theme
- [x] 2.2 Update `App.tsx` to render `<LoginScreen />` when `user` is `null`, a full-screen spinner when `loading` is `true`, and the editor `<Layout>` when authenticated

## 3. User Provisioning

- [x] 3.1 Add a `provisionUserProfile` function in `src/lib/firebase.ts` that creates/updates `/users/{userId}/profile` with `setDoc(..., { merge: true })`, setting `displayName`, `email`, `photoURL`, `lastLoginAt`, and `createdAt` (only on first write)
- [x] 3.2 Call `provisionUserProfile` from the auth context after successful sign-in

## 4. Firestore Security Rules

- [x] 4.1 Add a rule in `firestore.rules` for `/users/{userId}/profile` — allow read/write only when `request.auth.uid == userId`
- [x] 4.2 Add a validation function `isValidUserProfile` to enforce required fields (`displayName`, `email`, `photoURL`) on writes

## 5. Cleanup

- [x] 5.1 Remove the Google Sign-In button and login/logout UI from `Layout.tsx` (now handled by `LoginScreen` and auth context)
- [x] 5.2 Update `Settings.tsx` to consume `useAuth()` instead of receiving `user` as a prop
- [x] 5.3 Verify the existing Settings Firestore sync (`/users/{userId}/settings/preferences`) still works with the new auth context
