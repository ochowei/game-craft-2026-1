## ADDED Requirements

### Requirement: Test runner is configured
The project SHALL have Vitest configured as the test runner with jsdom environment, compatible with the existing Vite + React + TypeScript setup.

#### Scenario: Running tests via npm script
- **WHEN** a developer runs `npm test`
- **THEN** Vitest executes all `*.test.ts` and `*.test.tsx` files and reports results

### Requirement: Firebase auth mocking utilities exist
The project SHALL provide shared mock utilities for Firebase Auth that allow tests to control `onAuthStateChanged`, `signInWithPopup`, and `signOut` behavior.

#### Scenario: Test controls auth state callback
- **WHEN** a test uses the auth mock utilities
- **THEN** it can trigger `onAuthStateChanged` with a mock user or null to simulate auth state changes

#### Scenario: Test controls sign-in result
- **WHEN** a test uses the auth mock utilities
- **THEN** it can make `signInWithPopup` resolve with a mock user, resolve with null (popup closed), or reject with an error

### Requirement: Firebase Firestore mocking utilities exist
The project SHALL provide shared mock utilities for Firestore that allow tests to control `getDoc`, `setDoc`, and `doc` behavior.

#### Scenario: Test controls document existence
- **WHEN** a test uses the Firestore mock utilities
- **THEN** it can make `getDoc` return a snapshot that either exists with specified data or does not exist

#### Scenario: Test verifies Firestore writes
- **WHEN** a test uses the Firestore mock utilities
- **THEN** it can assert that `setDoc` was called with the expected document reference, data, and options

### Requirement: Auth context scenarios have test coverage
The project SHALL have tests covering all scenarios defined in the `auth-context` spec: AuthProvider mounting, user exposure, loading state, sign-in (success, popup closed, error), sign-out, and reactive auth state changes.

#### Scenario: Auth context test suite passes
- **WHEN** `npm test` is run
- **THEN** all auth-context tests pass, covering the 8 scenarios from the spec

### Requirement: Login screen scenarios have test coverage
The project SHALL have tests covering all scenarios defined in the `login-screen` spec: auth gate, branding, Google Sign-In button, loading state, error feedback, cancellation handling, and initial auth spinner.

#### Scenario: Login screen test suite passes
- **WHEN** `npm test` is run
- **THEN** all login-screen tests pass, covering the 7 scenarios from the spec

### Requirement: User provisioning scenarios have test coverage
The project SHALL have tests covering the client-side logic scenarios from the `user-provisioning` spec: first-time profile creation, returning user update, idempotent writes, and profile data sourcing from Firebase Auth.

#### Scenario: User provisioning test suite passes
- **WHEN** `npm test` is run
- **THEN** all user-provisioning client-side tests pass, covering the applicable scenarios from the spec

### Requirement: Firestore rules scenarios are documented as requiring emulator
The Firestore security rules scenarios (owner read/write, non-owner denied, unauthenticated denied) SHALL be documented as requiring the Firebase emulator for testing, with placeholder test stubs.

#### Scenario: Rules test stubs exist
- **WHEN** a developer opens the provisioning test file
- **THEN** there are skipped/todo test stubs for the 4 Firestore rules scenarios with a comment indicating they require the Firebase emulator
