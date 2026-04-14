## Context

The GameCraft Editor uses a `ThemeProvider` React context that reads the user's theme preference from Firestore (`/users/{userId}/settings/preferences`) and applies `dark` or `light` as a class on `<html>`. The problem is that `index.html` hardcodes `class="dark"` on `<html>`, and the ThemeProvider cannot resolve the correct theme until after Firebase Auth resolves (~200-500ms) and then Firestore delivers the preference (~100-300ms). Users who selected light theme see a 300-800ms flash of dark background on every page refresh.

## Goals / Non-Goals

**Goals:**
- Eliminate the visible dark-to-light flash on page refresh for users with a non-dark theme preference.
- Maintain dark as the correct default for first-ever visits (no localStorage value).
- Keep the solution minimal — no new dependencies, no SSR.

**Non-Goals:**
- Eliminating flash on the very first visit (dark default is correct and expected).
- Server-side rendering or edge-based theme detection.
- Changing the Firestore-based theme persistence model — localStorage is a cache, not the source of truth.

## Decisions

### 1. Blocking inline script in index.html

**Choice**: Add a `<script>` tag in `<head>` (before any CSS or body rendering) that reads `localStorage.getItem('theme-resolved')` and sets `document.documentElement.className` to the cached value.

**Alternatives considered**:
- **Cookie-based detection**: Requires a server to read the cookie. This is a pure SPA with no server-side rendering.
- **CSS `prefers-color-scheme` media query as default**: Only solves the `system` case. Users who explicitly chose `light` while their OS is `dark` would still flash.

**Rationale**: A blocking inline script executes before the browser paints. Reading localStorage is synchronous and sub-millisecond. This is the industry-standard approach (used by `next-themes`, Tailwind docs, etc.).

### 2. localStorage key: `theme-resolved`

**Choice**: Store the *resolved* theme (`'dark'` or `'light'`), not the raw preference (`'dark' | 'light' | 'system'`).

**Rationale**: The inline script runs before React, so it cannot resolve `'system'` via `matchMedia` reliably at that point. Storing the already-resolved value means the script just does a simple class assignment with no logic.

### 3. Remove hardcoded `class="dark"` from `<html>`

**Choice**: Remove the `class="dark"` attribute from `<html>` in `index.html`. The inline script sets the class; if localStorage is empty (first visit), it defaults to `'dark'`.

**Rationale**: The hardcoded `class="dark"` would conflict with the inline script — even if the script sets `'light'`, the browser may have already started rendering with the dark class from the HTML parse.

### 4. ThemeProvider writes to localStorage on every resolve

**Choice**: Add a single `localStorage.setItem('theme-resolved', resolved)` in the existing `useEffect` that applies the resolved theme to `<html>`.

**Rationale**: Co-locating the localStorage write with the DOM class update ensures they are always in sync. No additional effect or listener needed.

## Risks / Trade-offs

- **[localStorage vs Firestore drift]** → If a user changes their theme on device A, device B's localStorage still has the old value until the next full load completes. Mitigation: The flash is at most one load — once Firestore delivers the updated preference, localStorage is overwritten. This is a cache, not a source of truth.
- **[localStorage unavailable]** → In private browsing or restricted environments, `localStorage` may throw. Mitigation: Wrap in try/catch in both the inline script and ThemeProvider. Fallback is the current behavior (dark default, brief flash).
- **[First visit still dark]** → No cached value exists on first visit. Mitigation: This is expected and correct — dark is the default theme. No user has chosen a preference yet.
