## 1. Domain & types

- [ ] 1.1 Create `src/domain/project.ts` with `Project` type (`id`, `ownerId`, `members`, `name`, `description?`, `thumbnail?`, `createdAt`, `updatedAt`, `schemaVersion`), `ProjectRef` type (`role`, `addedAt`, `lastOpenedAt?`), `DEFAULT_PROJECT_NAME = 'My First Project'`, and `PROJECT_SCHEMA_VERSION = 1`.
- [ ] 1.2 Add `'projects'` to the `Screen` union in `src/types.ts`.

## 2. Firebase plumbing

- [ ] 2.1 Enable Firestore offline persistence in `src/lib/firebase.ts` via `initializeFirestore(app, { localCache: persistentLocalCache() })` (or the equivalent for the SDK version in use). Confirm emulator connection still works.
- [ ] 2.2 Update `provisionUserProfile` in `src/lib/firebase.ts` to merge with `setDoc(..., { merge: true })` so any pre-existing `lastOpenedProjectId` is preserved across logins (verify current behavior; adjust if needed).
- [ ] 2.3 Add Firestore helper module exports used by project operations (`runTransaction`, `collection`, `query`, `where`, `deleteDoc`, `serverTimestamp`, `onSnapshot`) from `src/lib/firebase.ts` re-exports.

## 3. Security rules

- [ ] 3.1 Extend `firestore.rules` with `match /projects/{projectId}` block: `isMember()` helper reading `resource.data.members[request.auth.uid]`; read/update gated by `isMember`; create gated by `ownerId == auth.uid && members[auth.uid] == 'owner'`; delete gated by `isOwner`; update rule prevents non-owners changing `ownerId`.
- [ ] 3.2 Add `match /projects/{projectId}/design/{docId}` block: read/write gated by `get(/databases/$(database)/documents/projects/$(projectId)).data.members[request.auth.uid] != null`.
- [ ] 3.3 Add `match /users/{uid}/projectRefs/{projectId}` block: read/write allowed only when `request.auth.uid == uid`.
- [ ] 3.4 Deploy rules to emulator; verify in Emulator UI that non-member reads are denied.

## 4. useFirestoreDoc hook

- [ ] 4.1 Create `src/hooks/useFirestoreDoc.ts` exposing `useFirestoreDoc<T>(path, { defaults, reducer, debounceMs = 500 })`. Return `{ state, dispatch, status }` where `status` is `'idle' | 'saving' | 'saved' | 'error'`.
- [ ] 4.2 Implement mount flow: initial `getDoc`, seed reducer state from doc (or `defaults`).
- [ ] 4.3 Implement `onSnapshot` subscription: incoming snapshot replaces local state (last-write-wins) via a special reducer action (e.g., `{ type: '__REMOTE_SYNC__', value }`).
- [ ] 4.4 Implement debounced write: on dispatch, schedule `setDoc(path, value, { merge: true })`; coalesce rapid edits.
- [ ] 4.5 Implement unmount flush: on unmount, run any pending debounced write synchronously before tearing down.
- [ ] 4.6 Surface status transitions for `SaveIndicator`: `saving` while in-flight, `saved` for ~5 s after success, `error` on rejection.
- [ ] 4.7 Unit test `useFirestoreDoc` with Firestore mocks covering: initial load, default fallback, debounce coalescing, external snapshot merge, unmount flush.

## 5. ProjectContext

- [ ] 5.1 Create `src/contexts/ProjectContext.tsx` with `ProjectProvider` exposing `{ projects, activeProjectId, loading, createProject, renameProject, deleteProject, openProject, closeActive }`.
- [ ] 5.2 Implement `projects` load: subscribe to `users/{uid}/projectRefs`, resolve each ref to `projects/{pid}` document; dedupe and sort by `updatedAt` desc.
- [ ] 5.3 Implement `createProject(name)` via `runTransaction`: write `projects/{newId}` (with `ownerId`, `members`, name, timestamps, `schemaVersion`) AND `users/{uid}/projectRefs/{newId}` atomically.
- [ ] 5.4 Implement `renameProject(id, newName)` via `updateDoc` on `projects/{id}` (updates `name` and `updatedAt`).
- [ ] 5.5 Implement `deleteProject(id)` via `runTransaction`: delete `projects/{id}`, `users/{uid}/projectRefs/{id}`, and best-effort cleanup of `projects/{id}/design/*` subdocuments. If currently active, clear `activeProjectId`.
- [ ] 5.6 Implement `openProject(id)`: set `activeProjectId`, write `lastOpenedProjectId` to profile via `setDoc(..., { merge: true })`, update `users/{uid}/projectRefs/{id}.lastOpenedAt`.
- [ ] 5.7 Implement `closeActive()`: signal a flush of pending design writes (see 6.3), then clear `activeProjectId`.
- [ ] 5.8 Implement first-login auto-provisioning: when `projectRefs` has loaded and is empty, automatically call `createProject('My First Project')` and set it active.
- [ ] 5.9 Implement last-opened hydration: on mount, after `projects` loads, if `profile.lastOpenedProjectId` is set and present in `projects`, call `openProject` on it; if it points to a stale id, clear the field and stay on list.
- [ ] 5.10 Unit tests: project list load, transactional create/delete, auto-provisioning, stale lastOpenedProjectId handling.

## 6. Domain context migration

- [ ] 6.1 Rewrite `RulesContext` to call `useFirestoreDoc` with `path = projects/{activeProjectId}/design/rules`, `defaults = DEFAULT_RULES`, existing `rulesReducer`. Remove `loadState` / `saveState` calls. Throw clearly if mounted without an `activeProjectId`.
- [ ] 6.2 Rewrite `CardsContext` analogously for `design/cards` with `DEFAULT_CARDS`.
- [ ] 6.3 Rewrite `BoardContext` analogously for `design/board` with `DEFAULT_BOARD`.
- [ ] 6.4 Rewrite `TokensContext` analogously for `design/tokens` with `DEFAULT_TOKENS`.
- [ ] 6.5 Expose each context's sync status upward so `SaveIndicator` can aggregate across all four.
- [ ] 6.6 `LibraryContext` is left unchanged (localStorage retained).

## 7. UI integration

- [ ] 7.1 Create `src/components/ActiveProjectRoot.tsx` that renders `<>{children}</>` and is mounted with `key={activeProjectId}` so the tree remounts on switch.
- [ ] 7.2 Create `src/components/SaveIndicator.tsx` consuming aggregated sync status; render `Saving…`, `Saved just now`, or error pill.
- [ ] 7.3 Create `src/components/ProjectListScreen.tsx`: list of project cards with open / rename / delete (confirmation) actions, `New project` button with a name prompt.
- [ ] 7.4 Update `src/App.tsx`: wrap with `ProjectProvider` inside `ThemeProvider`, keep `LibraryProvider` at the outer level (cross-project), wrap Rules/Cards/Board/Tokens providers inside `ActiveProjectRoot` keyed by `activeProjectId`.
- [ ] 7.5 Route in `App.tsx`: when `activeProjectId` is null OR `activeScreen === 'projects'`, render `ProjectListScreen`; otherwise render the appropriate editor.
- [ ] 7.6 Add `Projects` item to the navigation (`Layout`) with appropriate Material Symbol; ensure clicking it dispatches `closeActive()` then sets `activeScreen = 'projects'`.
- [ ] 7.7 Mount `SaveIndicator` in `Layout` header, visible only when a project is active.

## 8. Cleanup

- [ ] 8.1 Remove `gamecraft:{rules,cards,board,tokens}` usages of `loadState`/`saveState` (they are now unused by design contexts).
- [ ] 8.2 Keep `src/lib/storage.ts` in place; it remains used by `LibraryContext`.
- [ ] 8.3 Delete the domain context unit tests that asserted on localStorage reads/writes for Rules/Cards/Board/Tokens (or rewrite them to assert against the `useFirestoreDoc` mocks).

## 9. Seed & local development

- [ ] 9.1 Update `scripts/seed-emulator.ts` to seed a demo user, one demo project under that user (with members map, projectRefs reverse entry, and four design subdocuments using existing DEFAULT_* values).
- [ ] 9.2 Verify `npm run emulator:seed` populates Emulator UI with a project users can open via the app running in `npm run dev:emu`.

## 10. Verification

- [ ] 10.1 Run `npm run lint` — no type errors.
- [ ] 10.2 Run `npm test` — all passing, including new tests for `ProjectContext`, `useFirestoreDoc`, and migrated domain contexts.
- [ ] 10.3 Manual: first-login new user → lands in `My First Project` → edits propagate to Firestore → `SaveIndicator` cycles `Saving…` → `Saved just now`.
- [ ] 10.4 Manual: create second project → switch between them → confirm editor state is fully reset (tile selection, active deck type, etc.).
- [ ] 10.5 Manual: edit in two browser tabs of the same project → confirm last-write-wins and no console errors.
- [ ] 10.6 Manual: go offline, edit, come back online → writes flush.
- [ ] 10.7 Manual: log out, log back in → land back in last-opened project.
- [ ] 10.8 Manual: delete last-opened project → next login lands on `ProjectListScreen`.
- [ ] 10.9 Verify Firestore security rules in the Emulator UI Rules Playground: owner can read/write, a synthetic second user cannot read another user's project or projectRefs.

## 11. Documentation

- [ ] 11.1 Update `CLAUDE.md` provider-nesting-order section to reflect the new tree (`AuthProvider > ThemeProvider > ProjectProvider > LibraryProvider > ActiveProjectRoot > Rules/Cards/Board/Tokens`).
- [ ] 11.2 Update `CLAUDE.md` persistence section: Rules/Cards/Board/Tokens are now Firestore-backed under `projects/{activeProjectId}/design/*`; Library remains localStorage.
- [ ] 11.3 Update `openspec/domain-model.md` Project section from "concept reserved, not yet implemented" to "implemented (Phase 1)".
