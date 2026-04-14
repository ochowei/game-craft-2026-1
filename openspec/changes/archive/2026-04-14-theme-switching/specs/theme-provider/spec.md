## ADDED Requirements

### Requirement: ThemeProvider reads theme preference from Firestore
The `ThemeProvider` SHALL subscribe to the user's Firestore document at `/users/{userId}/settings/preferences` and read the `theme` field.

#### Scenario: User has a saved theme preference
- **WHEN** a logged-in user's Firestore preferences contain `theme: 'light'`
- **THEN** the `theme` value exposed by context is `'light'`

#### Scenario: User has no Firestore document
- **WHEN** a logged-in user's Firestore preferences document does not exist
- **THEN** the `theme` value defaults to `'dark'`

### Requirement: ThemeProvider resolves system theme via OS preference
The `ThemeProvider` SHALL resolve `theme: 'system'` by querying `matchMedia('(prefers-color-scheme: dark)')`.

#### Scenario: System theme with OS preferring dark
- **WHEN** the user's theme preference is `'system'` and the OS prefers dark mode
- **THEN** `resolvedTheme` is `'dark'`

#### Scenario: System theme with OS preferring light
- **WHEN** the user's theme preference is `'system'` and the OS prefers light mode
- **THEN** `resolvedTheme` is `'light'`

### Requirement: ThemeProvider reacts to OS preference changes
The `ThemeProvider` SHALL listen for changes to `prefers-color-scheme` and update `resolvedTheme` when the OS preference changes while in system mode.

#### Scenario: OS preference changes while in system mode
- **WHEN** the user's theme is `'system'` and the OS switches from light to dark
- **THEN** `resolvedTheme` updates to `'dark'` and `<html>` class changes to `dark`

### Requirement: ThemeProvider applies resolved theme to DOM
The `ThemeProvider` SHALL set `document.documentElement.className` to the resolved theme (`'dark'` or `'light'`).

#### Scenario: Theme applied to HTML element
- **WHEN** the resolved theme is `'light'`
- **THEN** `<html>` has class `light`

### Requirement: ThemeProvider defaults to dark when no user is logged in
When no user is authenticated, the `ThemeProvider` SHALL default to `theme: 'dark'` and `resolvedTheme: 'dark'`.

#### Scenario: No authenticated user
- **WHEN** no user is logged in
- **THEN** `theme` is `'dark'`, `resolvedTheme` is `'dark'`, and `<html>` has class `dark`

### Requirement: ThemeProvider exposes context values
The `ThemeProvider` SHALL expose via React context: `theme` (the stored preference: `'dark' | 'light' | 'system'`) and `resolvedTheme` (the effective theme: `'dark' | 'light'`).

#### Scenario: Context values accessible by child components
- **WHEN** a child component calls `useTheme()`
- **THEN** it receives `{ theme, resolvedTheme }` matching the current state
