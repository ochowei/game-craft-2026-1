# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite on port 3000)
- **Build:** `npm run build`
- **Type check:** `npm run lint` (runs `tsc --noEmit`)
- **Run all tests:** `npm run test` (Vitest)
- **Run single test:** `npx vitest run src/path/to/file.test.tsx`

## Architecture

GameCraft is a board game designer/editor built with React 19, Vite, Tailwind CSS v4, and Firebase. It lets users design Monopoly-style board games by editing rules, cards, board tiles, tokens, and a personal component library.

### Three-layer pattern: Domain / Context / Component

Each game feature (board, cards, rules, tokens, library) follows the same structure:

1. **`src/domain/<feature>.ts`** — Pure TypeScript types, constants, and defaults (no React). This is the source of truth for the data model.
2. **`src/contexts/<Feature>Context.tsx`** — React context + `useReducer` for state management. Loads initial state from localStorage via `src/lib/storage.ts`, persists on every state change. Exposes a typed `dispatch` and state values.
3. **`src/components/<Feature>Editor.tsx`** — UI component that consumes the context.

To add a new feature domain, replicate this pattern: define types in `domain/`, create a context with reducer and localStorage persistence in `contexts/`, then build the editor component.

### Provider nesting order

Providers wrap in `App.tsx` in this order (outermost first): `AuthProvider` > `ThemeProvider` > `RulesProvider` > `CardsProvider` > `BoardProvider` > `LibraryProvider` > `TokensProvider`. Auth and Theme are in `main.tsx`; the rest in `App.tsx`.

### Key conventions

- **State persistence:** All domain contexts use `loadState`/`saveState` from `src/lib/storage.ts` with keys prefixed `gamecraft:` (e.g., `gamecraft:board`). No backend persistence yet — everything is localStorage.
- **Auth:** Firebase Google sign-in via `src/lib/firebase.ts`. `AuthContext` gates the app — unauthenticated users see `LoginScreen`.
- **Theming:** Material Design 3-inspired design tokens defined as CSS custom properties in `src/index.css` under `@theme`. Dark theme is default; `.light` class overrides for light mode. `ThemeContext` manages the toggle.
- **Styling:** Tailwind v4 with `@tailwindcss/vite` plugin. Custom colors reference the MD3 tokens (e.g., `bg-surface-container`, `text-on-surface`). Glass morphism via `.glass-panel` utility class.
- **Icons:** Material Symbols Outlined (loaded via Google Fonts in `index.html`), referenced by ligature name.
- **Path alias:** `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`).
- **Navigation:** `App.tsx` uses a `Screen` union type (`src/types.ts`) and `useState` to switch between screens. No router.
- **Testing:** Vitest with jsdom environment and `@testing-library/react`. Setup file: `src/test/setup.ts`. Firebase is mocked via `src/test/firebase-mocks.ts`.
- **Environment:** `GEMINI_API_KEY` is expected in `.env.local` and exposed via Vite's `define` as `process.env.GEMINI_API_KEY`.
