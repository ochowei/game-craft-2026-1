## Why

`LibraryContext` is the only remaining domain that still persists to `localStorage` (`gamecraft:library`). The Phase 1 rollout deliberately deferred migrating Library because it's cross-project and orthogonal to the Project aggregate — fine for a single-device user, but already breaking the product promise now that projects and sharing are Firestore-backed:

- A user who edits their Library on their laptop and then opens the app on their phone sees a different Library (device-local state).
- A user who clears browser storage loses all their custom card templates, tile presets, and color palettes.
- The Library seed data is re-baked into every new device, creating false "defaults" that the user didn't choose.

This change moves Library to Firestore with the same optimistic-sync guarantees the design domains already enjoy, and drops the only remaining `localStorage` persistence path.

## What Changes

- Store Library items as individual documents under `users/{uid}/library/{itemId}` (per-user subcollection). Each `LibraryItem` is one Firestore document.
- Introduce `useFirestoreCollection` hook mirroring the `useFirestoreDoc` contract — `onSnapshot`-subscribed, optimistic local state, debounced writes per item.
- Rewrite `LibraryContext` to use the new hook; remove all `loadState` / `saveState` calls; delete the `gamecraft:library` localStorage key path.
- Add Firestore security rules for `users/{uid}/library/{itemId}`: only the owning user can read or write their own library.
- Update `scripts/seed-emulator.ts` to seed a Library subcollection for `test-user-001` so the emulator remains self-contained.
- Seed handling: on first mount for a brand-new user (empty Library collection), write the `DEFAULT_LIBRARY` entries as one-time seeds so the UI never shows an empty state for new sign-ups. Existing users with an already-populated Library are never re-seeded.

## Capabilities

### Modified Capabilities

- `library-domain-model` — the persistence requirement changes from `localStorage` to Firestore subcollection. Domain types (`LibraryItem`, `LibraryItemType`, `DEFAULT_LIBRARY`) are unchanged. The `LibraryContext` API surface (`items`, `activeFilter`, dispatch actions) is unchanged — only the persistence strategy changes.
- `localstorage-persistence` — the `gamecraft:library` key is **REMOVED**. Library no longer uses `loadState`/`saveState`. After this change there are **no callers** of the localStorage helpers; the helpers themselves can be deleted in a follow-up if there's no other use.

### New Capabilities

- None. This is a persistence migration, not a new feature.

## Impact

- **Modified files**
  - `src/contexts/LibraryContext.tsx` — rewrite to consume `useFirestoreCollection`; drop localStorage; accept `uid` dependency; auto-seed on first empty read.
  - `src/hooks/useFirestoreCollection.ts` — **new** shared hook. `onSnapshot` subscription, add/remove/update helpers, debounced writes per item.
  - `src/lib/firebase.ts` — no changes (all needed Firestore APIs already re-exported after Phase 1).
  - `firestore.rules` — add `match /users/{userId}/library/{itemId}` block; owner-only read/write.
  - `scripts/seed-emulator.ts` — add Library subcollection seed for `test-user-001`.
- **No longer used**
  - `gamecraft:library` localStorage key — abandoned (no migration code).
  - `loadState` / `saveState` in `src/lib/storage.ts` — no remaining callers after this change; file may be deleted or retained for a future use.
- **Dependencies** — no new runtime dependencies. Uses existing `firebase/firestore` APIs already exported: `collection`, `onSnapshot`, `setDoc`, `deleteDoc`, `doc`, `getDocs`.
- **Out of scope**
  - Migration of existing `gamecraft:library` data (no production users). Users testing in dev who want their local data migrated can export it manually.
  - Real-time sharing of Library across users. Library remains strictly per-user.
  - Library versioning / undo. Deferred to Phase 3's History capability.
- **Breaking behaviour** — existing localStorage Library data is **abandoned** on upgrade. Users (including developers) testing locally will see `DEFAULT_LIBRARY` re-seeded once on first sign-in to the new build; their prior additions in localStorage are lost.
