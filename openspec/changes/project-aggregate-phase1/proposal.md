## Why

GameCraft currently stores board game designs as a single implicit workspace — Board, Cards, Rules, and Tokens each live at a hardcoded `gamecraft:*` localStorage key. The domain model in `openspec/domain-model.md` already defines **Project** as the aggregate root that owns these four sub-domains, publishes Boxes, and tracks History, but Project has never been implemented as a first-class concept.

This gap means users cannot:

- Maintain multiple designs in parallel
- Switch between designs without overwriting local state
- Access their designs from another device
- Eventually share a design with collaborators (Phase 2+)

Phase 1 introduces the Project aggregate and moves persistence from localStorage to Firestore, delivering a complete multi-project experience in a single change. Because no production users exist yet, this is the right window to take the one-time storage cutover.

## What Changes

- Introduce `Project` as a top-level Firestore collection (`projects/{projectId}`) with owner/members metadata, reverse-indexed per user at `users/{uid}/projectRefs/{projectId}`.
- Move Board, Cards, Rules, and Tokens persistence from localStorage to Firestore subcollections under each project (`projects/{projectId}/design/{board|cards|rules|tokens}`). Library remains on localStorage (cross-project concern, out of Phase 1 scope).
- Add a `ProjectContext` that manages the project list and the currently active `projectId`.
- Add a `ProjectListScreen` for creating, renaming, deleting, and opening projects.
- Remount the domain providers (Rules/Cards/Board/Tokens) with `key={activeProjectId}` so switching projects fully resets editor state (open-file-like UX).
- Introduce a shared `useFirestoreDoc` hook: Firestore offline persistence, optimistic local state, 500 ms debounced writes, and `onSnapshot` subscription for external changes (last-write-wins).
- Add a `SaveIndicator` UI element showing `Saving…` / `Saved just now` status.
- Persist `lastOpenedProjectId` on the user profile so returning users land back in the last project they edited.
- Update Firestore security rules for the new `projects/*` and `users/{uid}/projectRefs/*` paths. Membership check is implemented as `isOwner` for Phase 1, structured so Phase 2 (sharing) can extend it without a schema change.
- Auto-create a `My First Project` on first login when the user has no projects, so the Editor is never in an empty state.

## Capabilities

### New Capabilities

- `project-management` — Project metadata CRUD, project list, active-project switching, last-opened memory, first-login auto-provisioning, and Firestore security rules for projects.
- `firestore-persistence` — Shared Firestore sync pattern (hook) used by the four design domains: offline persistence, debounced writes, `onSnapshot` subscription with last-write-wins merge, and save-state indicator UI.

### Modified Capabilities

- `localstorage-persistence` — Rules, Cards, Board, and Tokens persistence requirements are **REMOVED**; those domains move to Firestore. Library persistence and the `loadState`/`saveState` helpers remain (Library is still localStorage-only in Phase 1).
- `user-provisioning` — Profile document (`users/{uid}/profile/main`) gains an optional `lastOpenedProjectId` field.

## Impact

- **New files**
  - `src/domain/project.ts` — `Project` type, `ProjectRef` type, defaults.
  - `src/contexts/ProjectContext.tsx` — project list, `activeProjectId`, CRUD actions.
  - `src/components/ProjectListScreen.tsx` — list UI with create/rename/delete/open.
  - `src/components/ActiveProjectRoot.tsx` — wraps the four design providers, keyed by `activeProjectId` to force remount on switch.
  - `src/components/SaveIndicator.tsx` — `idle | saving | saved` status pill.
  - `src/hooks/useFirestoreDoc.ts` — shared sync hook.
- **Modified files**
  - `src/lib/firebase.ts` — enable Firestore offline persistence (`persistentLocalCache`).
  - `src/contexts/{Rules,Cards,Board,Tokens}Context.tsx` — rewrite to use `useFirestoreDoc`; drop localStorage.
  - `src/contexts/LibraryContext.tsx` — unchanged (still localStorage).
  - `src/lib/firebase.ts` — extend `provisionUserProfile` to preserve any existing `lastOpenedProjectId` on merge.
  - `src/App.tsx` — add `ProjectProvider`, route to `ProjectListScreen` when no active project, wrap design providers in `ActiveProjectRoot`.
  - `src/types.ts` — add `'projects'` to `Screen` union.
  - `src/lib/storage.ts` — retained for Library use; `gamecraft:{rules,cards,board,tokens}` reads are removed from callers.
  - `firestore.rules` — add rules for `projects/*`, `projects/*/design/*`, `users/{uid}/projectRefs/*`.
  - `scripts/seed-emulator.ts` — seed a sample project with design subdocuments under an owner user.
- **Dependencies** — No new runtime dependencies. Uses existing `firebase/firestore` APIs (`collection`, `doc`, `setDoc`, `onSnapshot`, `runTransaction`, `persistentLocalCache`).
- **Out of scope (Phase 2+)** — Sharing UI / invites; History (undo/redo, snapshots); Box export / Publishing; Game / play sessions; URL routing and shareable project links; real-time collaboration cursors; migrating Library to Firestore.
- **Breaking behaviour** — Existing localStorage contents for `gamecraft:{rules,cards,board,tokens}` are **abandoned** on upgrade. No production users exist, so no migration code is written. Library localStorage data is preserved.
