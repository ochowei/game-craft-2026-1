# Theme Switching Design

## Overview

Implement functional dark/light/system theme switching for the GameCraft Editor. The Settings page already has a theme toggle UI that saves to Firestore, but no code applies the theme to the actual UI. This design adds the runtime theme application and cleans up all hardcoded colors to use semantic tokens.

## Goals

- Make the existing Settings theme toggle (dark / light / system) actually work
- Support instant OS preference tracking when set to "system" via `prefers-color-scheme` media query listener
- Replace all 82 hardcoded color classes across 7 component files with semantic tokens

## Non-Goals

- Custom theme editor or user-defined color palettes
- Changes to the Settings page UI structure (the toggle already exists)
- Firestore rules changes (existing rules already support the `theme` field)

## Architecture

### Color System (`src/index.css`)

The existing `@theme` block defines dark-mode semantic tokens as CSS custom properties. Add a `.light` CSS selector that overrides the same properties with light-mode values.

```css
@theme {
  /* Dark tokens (default) */
  --color-surface: #121416;
  --color-on-surface: #e2e2e5;
  /* ... all existing tokens ... */
}

.light {
  /* Light overrides — same accent hues, adjusted for light backgrounds */
  --color-surface: #f8f9fc;
  --color-on-surface: #1a1c1e;
  /* ... all light tokens ... */
}
```

Light palette design principles:
- Surface colors: white/light gray spectrum
- On-surface colors: dark gray/near-black for readability
- Primary/secondary/tertiary: same hue family as dark theme but with adjusted lightness/saturation for light backgrounds
- Error: darker red (readable on light background)

### ThemeProvider (`src/contexts/ThemeContext.tsx`)

New React context that:

1. Subscribes to the user's Firestore `users/{uid}/settings/preferences` document to read the `theme` field
2. When `theme === 'system'`, attaches a `matchMedia('(prefers-color-scheme: dark)')` listener that fires on OS preference changes
3. Resolves the effective theme (`dark` or `light`) and sets `document.documentElement.className` accordingly
4. Exposes via context:
   - `theme`: the user's stored preference (`'dark' | 'light' | 'system'`)
   - `resolvedTheme`: the currently active theme (`'dark' | 'light'`)

**Mount location**: Inside `AuthProvider`, wrapping `App`. When no user is logged in, defaults to `dark`.

### Hardcoded Color Cleanup

All hardcoded Tailwind color classes are replaced with semantic tokens:

| Hardcoded Color | Semantic Token |
|---|---|
| `bg-slate-900`, `bg-slate-900/80` | `bg-surface-container`, `bg-surface-container/80` |
| `bg-slate-800` | `bg-surface-container-high` |
| `border-slate-800`, `border-slate-800/50` | `border-outline-variant`, `border-outline-variant/50` |
| `text-slate-400`, `text-slate-500` | `text-on-surface-variant` |
| `text-slate-300`, `hover:text-slate-300` | `hover:text-on-surface` |
| `text-white`, `hover:text-white` | `text-on-surface`, `hover:text-on-surface` |
| `text-blue-300`, `text-blue-400` | `text-primary` |
| `border-blue-400` | `border-primary` |
| `bg-blue-600`/`bg-blue-400` gradients | `bg-primary-container` / `bg-primary` |
| `bg-black/*` shadow colors | `shadow-surface-dim/*` or `shadow-outline-variant/*` |

Additionally, `index.html` has hardcoded `bg-[#121416] text-[#e2e2e5]` on `<body>` — remove these since `@layer base` in `index.css` already handles it.

## Files Changed

| File | Change |
|---|---|
| `src/index.css` | Add `.light` selector with light-mode token overrides |
| `index.html` | Remove hardcoded color classes from `<body>` |
| `src/contexts/ThemeContext.tsx` | New file — ThemeProvider + useTheme hook |
| `src/main.tsx` | Wrap App with ThemeProvider inside AuthProvider |
| `src/components/Layout.tsx` | Replace ~21 hardcoded colors with semantic tokens |
| `src/components/BoardEditor.tsx` | Replace ~26 hardcoded colors |
| `src/components/CardDesigner.tsx` | Replace ~28 hardcoded colors |
| `src/components/RulesEditor.tsx` | Replace ~2 hardcoded colors |
| `src/components/TemplateLibrary.tsx` | Replace ~2 hardcoded colors |
| `src/components/LoginScreen.tsx` | Replace ~2 hardcoded colors |
| `src/App.tsx` | Replace ~1 hardcoded color |

## Testing

- Toggle between dark/light/system in Settings and verify UI updates immediately
- Set to "system", change OS dark mode preference, verify app follows instantly
- Verify light theme has correct contrast and readability across all screens
- Verify no hardcoded colors remain that break in either theme
- Refresh the page and verify the theme persists from Firestore
- Test logged-out state defaults to dark theme
