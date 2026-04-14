## 1. Light Theme CSS Tokens

- [x] 1.1 Add `.light` CSS selector with light-mode token overrides in `src/index.css`
- [x] 1.2 Remove hardcoded color classes (`bg-[#121416] text-[#e2e2e5]`) from `<body>` in `index.html`
- [x] 1.3 Verify dark theme still renders correctly after changes
- [x] 1.4 Manually test light theme by adding `light` class to `<html>` in devtools

## 2. ThemeProvider Context

- [x] 2.1 Create `src/contexts/ThemeContext.tsx` with `ThemeProvider` and `useTheme` hook — subscribes to Firestore settings, resolves `system` via `matchMedia`, applies class to `<html>`
- [x] 2.2 Create `src/contexts/ThemeContext.test.tsx` with tests for: default dark, Firestore-driven light, system resolution, OS preference change, missing Firestore doc
- [x] 2.3 Wire `ThemeProvider` into `src/main.tsx` inside `AuthProvider`, consuming `useAuth` for the user prop

## 3. Hardcoded Color Cleanup

- [x] 3.1 Replace ~21 hardcoded colors in `src/components/Layout.tsx` with semantic tokens
- [x] 3.2 Replace ~26 hardcoded colors in `src/components/BoardEditor.tsx` with semantic tokens
- [x] 3.3 Replace ~28 hardcoded colors in `src/components/CardDesigner.tsx` with semantic tokens
- [x] 3.4 Replace ~2 hardcoded colors in `src/components/LoginScreen.tsx` with semantic tokens
- [x] 3.5 Replace ~1 hardcoded color in `src/App.tsx` with semantic tokens
- [x] 3.6 Verify no hardcoded `slate-` or `blue-[0-9]` colors remain across all component files

## 4. Final Verification

- [x] 4.1 Toggle between dark/light/system in Settings and verify UI updates immediately
- [x] 4.2 Set to "system", change OS dark mode preference, verify app follows instantly
- [x] 4.3 Verify light theme contrast and readability across all screens
- [x] 4.4 Refresh the page and verify theme persists from Firestore
- [x] 4.5 Test logged-out state defaults to dark theme
- [x] 4.6 Run full test suite — all tests pass
