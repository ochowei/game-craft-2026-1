## 1. useFirestoreCollection hook

- [x] 1.1 Create `src/hooks/useFirestoreCollection.ts` exporting `useFirestoreCollection<T>(path: string | null, options: { idField: keyof T; debounceMs?: number })` returning `{ items: T[], addItem, removeItem, updateItem, status }`. Accept `null` path to short-circuit (unauthenticated case).
- [x] 1.2 Implement mount: `onSnapshot(collection(db, path), ...)`; derive `items` from the snapshot docs. Map each doc's `{ id: docId, ...data }` into `T`.
- [x] 1.3 Implement `addItem(item)`: `setDoc(doc(db, path, String(item[idField])), item)` — no debounce.
- [x] 1.4 Implement `removeItem(id)`: `deleteDoc(doc(db, path, id))` — no debounce.
- [x] 1.5 Implement `updateItem(id, partial)`: debounced `setDoc(doc(db, path, id), partial, { merge: true })`. Coalesce rapid updates per id.
- [x] 1.6 Implement unmount: flush any pending debounced updates synchronously; then unsubscribe.
- [x] 1.7 Status transitions: `idle` when nothing in flight, `saving` while at least one write is pending, `saved` for ~5 s after the last write resolves, `error` on rejection (surfaced from any op).
- [x] 1.8 Unit tests (`src/hooks/useFirestoreCollection.test.tsx`):
  - initial load with seeded docs populates `items`
  - `addItem` fires `setDoc` with correct path
  - `removeItem` fires `deleteDoc` with correct path
  - `updateItem` coalesces rapid calls into one `setDoc`
  - unmount with pending update flushes before teardown
  - passing `null` path results in empty items and no-op mutations

## 2. Security rules

- [x] 2.1 In `firestore.rules`, add:
  ```
  match /users/{userId}/library/{itemId} {
    allow read, write: if isOwner(userId);
  }
  ```
  (Place alongside existing `users/{userId}/*` blocks.)
- [x] 2.2 Deploy to emulator; verify via Rules Playground: owner read allowed, cross-user read denied, unauthenticated read denied.

## 3. LibraryContext rewrite

- [x] 3.1 Update `src/contexts/LibraryContext.tsx`:
  - Import `useAuth` from `AuthContext`.
  - Import `useFirestoreCollection`.
  - Compute `path = user ? \`users/${user.uid}/library\` : null`.
  - Call `const { items, addItem, removeItem, status } = useFirestoreCollection<LibraryItem>(path, { idField: 'id' })`.
  - Keep `activeFilter` in a local `useState<LibraryFilter>('all')`.
  - Replace `dispatch({ type: 'ADD_ITEM', item })` wiring: expose a `dispatch`-shaped API that maps `ADD_ITEM → addItem`, `REMOVE_ITEM → removeItem`, `SET_FILTER → setActiveFilter`. Preserve the public context shape so `Library.tsx` needs no changes (or minimal: filter dispatch still works).
- [x] 3.2 Remove all references to `loadState` and `saveState` in `LibraryContext.tsx`. Remove the `STORAGE_KEY` constant. Remove the `useReducer` + `saveState` effect.
- [x] 3.3 On first mount for a signed-in user: after the first snapshot arrives, if `items.length === 0` **and** the seed has not yet been attempted this session, write all `DEFAULT_LIBRARY` entries via `writeBatch`. Track the seed attempt in a `useRef<boolean>(false)` so it fires at most once per provider instance. Do not gate on user identity changes within one session — the ref resets on provider remount (which happens on sign-in/out).
- [x] 3.4 Surface `status` to `SyncStatusContext` (`report('library', status)`) so the global `SaveIndicator` reflects Library writes too.
- [x] 3.5 Unit tests (`src/contexts/LibraryContext.test.tsx`):
  - provider with signed-in user subscribes to the correct path
  - provider with null user exposes empty items and no-op dispatch
  - dispatching `ADD_ITEM` invokes `addItem` with the correct arg
  - dispatching `REMOVE_ITEM` invokes `removeItem`
  - dispatching `SET_FILTER` updates local `activeFilter` without any Firestore calls
  - first-mount seed fires when `onSnapshot` delivers empty collection
  - first-mount seed does NOT fire when `onSnapshot` delivers non-empty collection
  - second subscription to the same provider does NOT re-seed

## 4. Cleanup

- [x] 4.1 Verify `src/lib/storage.ts` has no remaining callers (`grep -R "loadState\|saveState" src/`). If truly unused, delete the file in this PR's final commit. If any caller remains (tests, util), keep it.
- [x] 4.2 If the `gamecraft:library` key appears elsewhere (unlikely), remove it. Grep `gamecraft:library` across the tree to confirm.

## 5. Seed & local development

- [x] 5.1 Update `scripts/seed-emulator.ts`:
  - After the `test-user-001` profile setup, iterate `DEFAULT_LIBRARY` and write each entry to `users/test-user-001/library/{item.id}`.
  - Print a log line `  ✓ Library seed (N items) for test-user-001`.
- [x] 5.2 Run `npm run emulator:seed` and verify in the Emulator UI that `users/test-user-001/library/*` contains the seed entries.

## 6. App integration

- [x] 6.1 Confirm `LibraryProvider` remains mounted outside `ProjectProvider` in `App.tsx` (cross-project scope unchanged). No provider-tree changes required.
- [x] 6.2 Confirm `Library.tsx` still renders correctly — the context API surface is preserved, so the component should not need changes. Verify by manual render.

## 7. Verification

- [x] 7.1 Run `npm run lint` — zero errors.
- [x] 7.2 Run `npm run test` — all existing tests pass; new tests for `useFirestoreCollection` and migrated `LibraryContext` pass.
- [x] 7.3 Manual: seed emulator, sign in as `test-user-001`, open Library — see seeded items. Add a new item — confirm Firestore document appears in Emulator UI.
- [x] 7.4 Manual: sign in a brand-new user (create in Emulator Auth UI), open Library — see `DEFAULT_LIBRARY` seeded automatically. Delete one item — confirm Firestore doc removed. Reload — seed does NOT re-fire (remaining items stay as user left them).
- [x] 7.5 Manual: open two tabs as the same user, add a Library item in tab A — tab B sees it within ~1 s via `onSnapshot`.
- [x] 7.6 Manual: Emulator Rules Playground — verify owner read/write allowed, cross-user read denied, unauthenticated denied.

## 8. Documentation

- [x] 8.1 Update `CLAUDE.md`:
  - In the "Key conventions" → "State persistence" bullet, update the Library description to reflect Firestore persistence.
  - Remove the "Library is the only localStorage domain" claim.
- [x] 8.2 Update `openspec/domain-model.md`: the Library section's status can remain "implemented" but consider appending a note that persistence moved to Firestore in this change.
