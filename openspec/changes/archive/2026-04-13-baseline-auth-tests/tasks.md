## 1. Test Infrastructure Setup

- [x] 1.1 Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- [x] 1.2 Add Vitest config (jsdom environment, test file glob) — either in `vite.config.ts` or a separate `vitest.config.ts`
- [x] 1.3 Add `"test": "vitest run"` script to `package.json`
- [x] 1.4 Add a test setup file (`src/test/setup.ts`) that imports `@testing-library/jest-dom`

## 2. Firebase Mock Utilities

- [x] 2.1 Create `src/test/firebase-mocks.ts` with mock helpers for `onAuthStateChanged`, `signInWithPopup`, `signOut` (controllable callbacks and return values)
- [x] 2.2 Add Firestore mock helpers to `src/test/firebase-mocks.ts` for `getDoc`, `setDoc`, `doc`, and `serverTimestamp`

## 3. Auth Context Tests

- [x] 3.1 Create `src/contexts/AuthContext.test.tsx` with tests for all 8 auth-context spec scenarios: provider mounting, user exposure (authenticated/unauthenticated), loading state (initial/resolved), sign-in (success/popup-closed/error), sign-out, and reactive auth state changes

## 4. Login Screen Tests

- [x] 4.1 Create `src/components/LoginScreen.test.tsx` with tests for all 7 login-screen spec scenarios: auth gate (unauthenticated/authenticated), branding, Google Sign-In button, loading state (in-progress/completes), error feedback (error/cancellation), and initial auth spinner

## 5. User Provisioning Tests

- [x] 5.1 Create `src/lib/firebase.test.ts` with tests for client-side provisioning scenarios: first-time profile creation, returning user update, idempotent merge writes, and profile data sourcing from auth object
- [x] 5.2 Add skipped test stubs for the 4 Firestore rules scenarios (owner read/write, non-owner denied, unauthenticated denied) with comments indicating they require Firebase emulator

## 6. Verification

- [x] 6.1 Run `npm test` and verify all tests pass with no failures
