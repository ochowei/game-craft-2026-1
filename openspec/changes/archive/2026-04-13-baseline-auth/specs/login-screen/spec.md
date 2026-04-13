## ADDED Requirements

### Requirement: Auth gate blocks unauthenticated access
The application SHALL display the login screen instead of the editor UI when no user is authenticated.

#### Scenario: Unauthenticated user visits the app
- **WHEN** a user opens the application and is not signed in
- **THEN** the login screen is displayed and no editor screens (Board, Cards, Rules, Tokens, Library, Settings) are accessible

#### Scenario: Authenticated user visits the app
- **WHEN** a user opens the application and is already signed in
- **THEN** the editor UI is displayed normally

### Requirement: Login screen displays application branding
The login screen SHALL display the application name "GameCraft Editor" and a brief tagline, styled consistently with the existing dark theme.

#### Scenario: Login screen renders branding
- **WHEN** the login screen is displayed
- **THEN** the application name and tagline are visible

### Requirement: Login screen provides Google Sign-In button
The login screen SHALL display a Google Sign-In button that triggers the auth context's `signIn` function.

#### Scenario: User clicks Google Sign-In
- **WHEN** the user clicks the Google Sign-In button
- **THEN** the Google sign-in popup opens

### Requirement: Login screen shows loading state during sign-in
The login screen SHALL display a loading indicator while the sign-in process is in progress, and the sign-in button SHALL be disabled.

#### Scenario: Sign-in in progress
- **WHEN** the user has clicked the sign-in button and the popup is open
- **THEN** a loading indicator is shown and the sign-in button is disabled

#### Scenario: Sign-in completes
- **WHEN** the sign-in process finishes (success or cancellation)
- **THEN** the loading indicator is removed

### Requirement: Login screen shows error feedback
The login screen SHALL display an error message when sign-in fails due to a non-cancellation error.

#### Scenario: Sign-in error
- **WHEN** the Google sign-in fails (e.g., network error)
- **THEN** an error message is displayed to the user

#### Scenario: User cancels sign-in
- **WHEN** the user closes the sign-in popup without completing
- **THEN** no error message is displayed

### Requirement: Loading spinner during initial auth check
The application SHALL display a full-screen loading spinner while the initial auth state is being determined (before deciding to show login screen or editor).

#### Scenario: App is resolving initial auth state
- **WHEN** the application loads and `loading` is `true`
- **THEN** a full-screen spinner is shown instead of the login screen or editor
