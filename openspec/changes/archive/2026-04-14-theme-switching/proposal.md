## Why

The Settings page already has a dark/light/system theme toggle that saves the preference to Firestore, but no code actually applies the selected theme to the UI. The app is permanently dark — toggling the setting does nothing visible. Additionally, 82 hardcoded Tailwind color classes (e.g. `slate-900`, `blue-400`) are scattered across 7 component files, making any future theming impossible without a search-and-replace pass.

## What Changes

- Define light-mode CSS custom properties in a `.light` selector in `index.css`, mirroring the existing dark-mode `@theme` tokens.
- Create a `ThemeProvider` React context that reads the user's theme preference from Firestore, resolves `system` via `matchMedia('prefers-color-scheme: dark')`, and applies the resolved class (`dark` or `light`) to `<html>`.
- Replace all 82 hardcoded Tailwind color classes across 7 component files with semantic token equivalents.
- Remove hardcoded inline colors from `index.html` `<body>`.

## Capabilities

### New Capabilities
- `theme-tokens`: Light-mode CSS custom property overrides that activate via a `.light` class on `<html>`.
- `theme-provider`: React context that subscribes to Firestore settings, resolves the effective theme, and applies it to the DOM.

### Modified Capabilities
- `color-cleanup`: All components migrated from hardcoded Tailwind colors to semantic tokens, enabling theme switching.

## Impact

- **Code**: New file `src/contexts/ThemeContext.tsx`. Modified files: `src/index.css`, `index.html`, `src/main.tsx`, `src/components/Layout.tsx`, `src/components/BoardEditor.tsx`, `src/components/CardDesigner.tsx`, `src/components/RulesEditor.tsx`, `src/components/TemplateLibrary.tsx`, `src/components/LoginScreen.tsx`, `src/App.tsx`.
- **Dependencies**: No new npm packages — uses existing CSS custom properties, React context, and Firebase SDK.
- **UX**: Users can now switch between dark, light, and system themes via the existing Settings toggle and see the change applied immediately.
