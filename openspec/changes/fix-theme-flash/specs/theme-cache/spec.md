## ADDED Requirements

### Requirement: Inline script applies cached theme before first paint
The application SHALL include a blocking inline `<script>` in `<head>` of `index.html` that reads the resolved theme from `localStorage` and applies it to `<html>` before the browser renders any content.

#### Scenario: Cached theme exists in localStorage
- **WHEN** the page loads and `localStorage` contains key `theme-resolved` with value `light`
- **THEN** `<html>` has class `light` before any visible content is painted

#### Scenario: No cached theme in localStorage (first visit)
- **WHEN** the page loads and `localStorage` does not contain key `theme-resolved`
- **THEN** `<html>` has class `dark` as the default

#### Scenario: localStorage is unavailable
- **WHEN** the page loads and `localStorage` throws an error (e.g., private browsing restrictions)
- **THEN** `<html>` has class `dark` as the fallback and no error is thrown

### Requirement: ThemeProvider persists resolved theme to localStorage
The `ThemeProvider` SHALL write the resolved theme (`'dark'` or `'light'`) to `localStorage` under key `theme-resolved` whenever the resolved theme changes.

#### Scenario: Theme resolves to light
- **WHEN** the ThemeProvider resolves the effective theme as `light`
- **THEN** `localStorage.getItem('theme-resolved')` returns `'light'`

#### Scenario: Theme resolves to dark
- **WHEN** the ThemeProvider resolves the effective theme as `dark`
- **THEN** `localStorage.getItem('theme-resolved')` returns `'dark'`

#### Scenario: localStorage write fails silently
- **WHEN** the ThemeProvider attempts to write to `localStorage` and it throws
- **THEN** no error is surfaced to the user and the theme still applies correctly to the DOM

### Requirement: No hardcoded theme class on html element
The `<html>` element in `index.html` SHALL NOT have a hardcoded `class` attribute. The theme class SHALL be set exclusively by the inline script and subsequently by ThemeProvider.

#### Scenario: HTML source has no hardcoded class
- **WHEN** inspecting the raw `index.html` source
- **THEN** the `<html>` tag does not contain `class="dark"` or any other theme class
