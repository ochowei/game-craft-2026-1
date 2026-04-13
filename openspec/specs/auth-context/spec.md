## ADDED Requirements

### Requirement: AuthProvider wraps the application
The application SHALL provide an `AuthProvider` React context provider that wraps the entire component tree at the root level.

#### Scenario: AuthProvider is mounted at app root
- **WHEN** the application renders
- **THEN** all child components have access to the auth context

### Requirement: Auth context exposes current user
The auth context SHALL expose a `user` property that is the Firebase `User` object when authenticated, or `null` when not authenticated.

#### Scenario: User is authenticated
- **WHEN** a user has signed in with Google
- **THEN** the `user` property contains the Firebase User object with `uid`, `displayName`, `email`, and `photoURL`

#### Scenario: User is not authenticated
- **WHEN** no user is signed in
- **THEN** the `user` property is `null`

### Requirement: Auth context exposes loading state
The auth context SHALL expose a `loading` boolean that is `true` while the initial auth state is being determined and `false` once resolved.

#### Scenario: Initial auth state resolution
- **WHEN** the app first loads and Firebase has not yet emitted an auth state
- **THEN** `loading` is `true`

#### Scenario: Auth state resolved
- **WHEN** Firebase emits the initial auth state (either a user or null)
- **THEN** `loading` is `false`

### Requirement: Auth context exposes sign-in action
The auth context SHALL expose a `signIn` function that triggers Google Sign-In via popup.

#### Scenario: Successful sign-in
- **WHEN** `signIn` is called and the user completes the Google popup
- **THEN** the `user` property updates to the authenticated Firebase User

#### Scenario: Sign-in popup closed by user
- **WHEN** `signIn` is called and the user closes the popup without completing sign-in
- **THEN** the `user` property remains `null` and no error is thrown

#### Scenario: Sign-in fails
- **WHEN** `signIn` is called and an error occurs (network failure, etc.)
- **THEN** the function SHALL throw the error so the caller can handle it

### Requirement: Auth context exposes sign-out action
The auth context SHALL expose a `signOut` function that signs the user out of Firebase.

#### Scenario: Successful sign-out
- **WHEN** `signOut` is called while a user is authenticated
- **THEN** the `user` property becomes `null`

### Requirement: Auth context subscribes to auth state changes
The auth context SHALL use Firebase `onAuthStateChanged` to reactively update the `user` property whenever the auth state changes (e.g., token refresh, session expiry).

#### Scenario: Auth state changes externally
- **WHEN** the Firebase auth state changes (e.g., session expires in another tab)
- **THEN** the `user` property updates to reflect the new state
