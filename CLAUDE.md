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
2. **`src/contexts/<Feature>Context.tsx`** — React context for state management. Design domains (rules, cards, board, tokens) use the shared `useFirestoreDoc` hook (`src/hooks/useFirestoreDoc.ts`) to sync state with `projects/{activeProjectId}/design/<feature>`. `LibraryContext` uses the shared `useFirestoreCollection` hook (`src/hooks/useFirestoreCollection.ts`) to sync a per-user subcollection at `users/{uid}/library/{itemId}`.
3. **`src/components/<Feature>Editor.tsx`** — UI component that consumes the context.

The `Project` aggregate is the top-level container; see `src/domain/project.ts` and `src/contexts/ProjectContext.tsx`. A project owns one Board, one Rules, one Tokens collection, and one Cards collection, all stored as Firestore subdocuments under `projects/{projectId}/design/*`.

### Provider nesting order

Providers wrap in `main.tsx` / `App.tsx` in this order (outermost first):
`AuthProvider` > `ThemeProvider` > `SyncStatusProvider` > `LibraryProvider` > `ProjectProvider` > `ActiveProjectRoot` (keyed by `activeProjectId`) > `RulesProvider` > `CardsProvider` > `BoardProvider` > `TokensProvider`.

Auth and Theme are in `main.tsx`; the rest in `App.tsx`. `LibraryProvider` sits outside `ProjectProvider` because Library is cross-project, and inside `SyncStatusProvider` so Library writes participate in the global `SaveIndicator`. `<ActiveProjectRoot projectKey={activeProjectId}>` forces the four design providers to unmount/remount whenever the active project changes, giving an "open-file" UX that fully resets editor state.

### Key conventions

- **State persistence:** The four design domains (Rules, Cards, Board, Tokens) persist to Firestore under `projects/{activeProjectId}/design/*` via the shared `useFirestoreDoc` hook — optimistic local state, 500 ms debounced `setDoc({ merge: true })`, `onSnapshot` last-write-wins. UI-only state (selections, active filters) lives in sibling `useState` and is **not** persisted. `LibraryContext` persists at `users/{uid}/library/{itemId}` via the shared `useFirestoreCollection` hook (one Firestore document per `LibraryItem`); on first mount for a user whose collection is empty, `DEFAULT_LIBRARY` is written to Firestore via `writeBatch` as a one-time seed. Project metadata lives at `projects/{pid}` with a reverse index at `users/{uid}/projectRefs/{pid}`; create/delete run in a `runTransaction` so the pair stays consistent.
- **Roles:** A project's `members` map uses three roles: `owner` | `editor` | `viewer`. Owner has full control including membership management + delete. Editor can read + write design docs + leave. Viewer is read-only and sees a `<ReadOnlyBanner />` plus a `<fieldset disabled>` around the editor tree. The active role is read via `useActiveRole()` (`src/hooks/useActiveRole.ts`). Membership mutations go through `ProjectContext` (`addMember`, `removeMember`, `changeRole`, `leaveProject`) and always use `runTransaction` over `projects/{pid}.members` + `users/{targetUid}/projectRefs/{pid}`. Email resolution uses `lookupUserByEmail` (`src/hooks/useUserLookup.ts`) via a collection-group query on `publicProfile/main`.
- **Auth:** Firebase Google sign-in via `src/lib/firebase.ts`. `AuthContext` gates the app — unauthenticated users see `LoginScreen`.
- **Theming:** Material Design 3-inspired design tokens defined as CSS custom properties in `src/index.css` under `@theme`. Dark theme is default; `.light` class overrides for light mode. `ThemeContext` manages the toggle.
- **Styling:** Tailwind v4 with `@tailwindcss/vite` plugin. Custom colors reference the MD3 tokens (e.g., `bg-surface-container`, `text-on-surface`). Glass morphism via `.glass-panel` utility class.
- **Icons:** Material Symbols Outlined (loaded via Google Fonts in `index.html`), referenced by ligature name.
- **Path alias:** `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`).
- **Navigation:** `App.tsx` uses a `Screen` union type (`src/types.ts`) and `useState` to switch between screens. No router.
- **Testing:** Vitest with jsdom environment and `@testing-library/react`. Setup file: `src/test/setup.ts`. Firebase is mocked via `src/test/firebase-mocks.ts`.
