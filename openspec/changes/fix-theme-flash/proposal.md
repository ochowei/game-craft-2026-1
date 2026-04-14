## Why

When a user has selected light or system (light) theme, refreshing the page causes a visible flash of dark background before the correct theme is applied. This happens because the HTML hardcodes `class="dark"`, and the ThemeProvider must wait for Firebase Auth + Firestore read (~300-800ms) before it can resolve and apply the correct theme. This creates a jarring visual experience on every page load.

## What Changes

- Add a blocking inline `<script>` in `index.html` that reads the last resolved theme from `localStorage` and applies it to `<html>` before any rendering occurs.
- Update `ThemeProvider` to persist the resolved theme to `localStorage` whenever it changes, so the inline script has a value to read on subsequent loads.
- Remove the hardcoded `class="dark"` from `<html>` in `index.html` — the inline script (or CSS default) handles the initial class.

## Capabilities

### New Capabilities
- `theme-cache`: localStorage-based theme caching that eliminates flash-of-wrong-theme on page load by applying the last known resolved theme before React mounts.

### Modified Capabilities

## Impact

- **Code**: `index.html` (inline script + remove hardcoded class), `src/contexts/ThemeContext.tsx` (add localStorage write).
- **Dependencies**: None — uses built-in `localStorage` API.
- **UX**: Eliminates the dark-to-light flash on refresh for users who have selected light or system theme. First-ever visit still defaults to dark (no localStorage value yet), which is the expected behavior.
