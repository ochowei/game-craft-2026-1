## Context

The GameCraft Editor is a React 19 + Vite + Tailwind CSS v4 + Firebase SPA. The existing `@theme` block in `src/index.css` defines dark-mode semantic tokens as CSS custom properties. The Settings page writes a `theme` field (`'dark' | 'light' | 'system'`) to Firestore at `/users/{userId}/settings/preferences`, but nothing reads this value to apply a theme. All component files use hardcoded Tailwind color classes like `bg-slate-900`, `text-blue-400`, etc.

## Goals / Non-Goals

**Goals:**
- Make the existing Settings theme toggle (dark / light / system) actually apply to the UI.
- Support instant OS preference tracking when set to "system" via `prefers-color-scheme` media query listener.
- Replace all 82 hardcoded color classes across 7 component files with semantic tokens.

**Non-Goals:**
- Custom theme editor or user-defined color palettes.
- Changes to the Settings page UI structure (the toggle already exists).
- Firestore rules changes (existing rules already support the `theme` field).

## Decisions

### 1. CSS custom properties with class-based switching

**Choice**: Define light-mode overrides in a `.light` CSS selector. The `<html>` element gets either `dark` or `light` as its class. Dark is the default (tokens defined in `@theme`).

**Alternatives considered**:
- **CSS `prefers-color-scheme` media query only**: Cannot support the user's explicit override (e.g., preferring light while OS is dark).
- **Tailwind `dark:` variant classes**: Would require adding `dark:` prefixes to every color class — massive churn and harder to maintain.

**Rationale**: Class-based switching gives full control. The `@theme` block provides dark defaults; `.light` overrides only what changes. Minimal CSS additions.

### 2. ThemeProvider as a React context

**Choice**: A `ThemeProvider` context component that subscribes to Firestore settings, resolves the effective theme, and sets `document.documentElement.className`.

**Alternatives considered**:
- **Direct DOM manipulation in Settings component**: Would only work while Settings is mounted. Theme must persist across all screens.
- **Zustand/external store**: Unnecessary for a single derived value from one Firestore field.

**Rationale**: Context is idiomatic React. The provider mounts once at the root, subscribes to Firestore, and reactively resolves the theme. All components automatically re-render with new token values via CSS — no prop-drilling needed.

### 3. Light palette design principles

**Choice**: Same hue families as the dark theme, adjusted for light backgrounds:
- Surface colors: white/light gray spectrum
- On-surface colors: dark gray/near-black for readability
- Primary/secondary/tertiary: same hue, adjusted lightness/saturation
- Error: darker red for light background contrast

**Rationale**: Visual consistency across themes. Users recognize the same brand colors regardless of theme.

### 4. Semantic token replacement strategy

**Choice**: One-pass replacement of all hardcoded colors across all component files, guided by a mapping table (e.g., `bg-slate-900` → `bg-surface-container`).

**Alternatives considered**:
- **Gradual migration**: Risk of inconsistent theming during transition — some components would theme-switch while others stayed dark.

**Rationale**: The mapping is mechanical and well-defined. A single pass ensures consistency and avoids a half-themed intermediate state.

## Risks / Trade-offs

- **[Light palette contrast]** → Hand-picked light values may have insufficient contrast in some combinations. Mitigation: manual visual verification across all screens in both themes.
- **[Firestore latency on load]** → First render may flash dark before Firestore delivers the preference. Mitigation: acceptable for MVP; dark is the default and the flash is sub-second.
- **[Gradient removal]** → The active nav item used `bg-gradient-to-br from-blue-600 to-blue-400`, replaced with solid `bg-primary`. Mitigation: the gradient was decorative; solid primary is cleaner and theme-compatible.
