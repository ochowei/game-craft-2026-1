## MODIFIED Requirements

### Requirement: LibraryContext provides state and dispatch
The system SHALL provide a `LibraryContext` that exposes library state and mutation actions. The context SHALL source `items` from Firestore (`users/{uid}/library/{itemId}` subcollection) via a shared `useFirestoreCollection` hook. UI-only state (`activeFilter`) SHALL remain in component state and SHALL NOT be persisted.

#### Scenario: Context provides library state
- **WHEN** a component calls `useLibrary()`
- **THEN** it SHALL receive `items` (LibraryItem array) AND `activeFilter` (LibraryItemType | 'all')

#### Scenario: Context returns empty items when not signed in
- **WHEN** `LibraryProvider` is mounted without an authenticated user
- **THEN** `items` SHALL be an empty array AND dispatched mutations SHALL be no-ops

#### Scenario: Context reflects Firestore updates in real time
- **WHEN** a Library item is added, removed, or modified from another tab or device
- **THEN** the subscribed context SHALL receive the update via `onSnapshot` and re-render with the new items

### Requirement: Library reducer handles ADD_ITEM action
Dispatching `ADD_ITEM` SHALL write the new item to Firestore at `users/{uid}/library/{item.id}`. The local `items` array SHALL reflect the add after the Firestore `onSnapshot` delivers the new document.

#### Scenario: Add a card template persists to Firestore
- **WHEN** dispatch receives `{ type: 'ADD_ITEM', item: <LibraryItem> }` for signed-in user `uid_A`
- **THEN** a Firestore document SHALL be written at `users/uid_A/library/{item.id}` with the item's fields
- **THEN** the local `items` array SHALL include the new item on next snapshot

### Requirement: Library reducer handles REMOVE_ITEM action
Dispatching `REMOVE_ITEM` SHALL delete the corresponding Firestore document at `users/{uid}/library/{itemId}`.

#### Scenario: Remove an item deletes the Firestore doc
- **WHEN** dispatch receives `{ type: 'REMOVE_ITEM', itemId: 'seed-card-1' }` for signed-in user `uid_A`
- **THEN** the document `users/uid_A/library/seed-card-1` SHALL be deleted from Firestore
- **THEN** the local `items` array SHALL no longer include that item on next snapshot

## ADDED Requirements

### Requirement: Library persists to Firestore per-user subcollection
The system SHALL persist Library items as individual Firestore documents under `users/{uid}/library/{itemId}`, where `itemId` equals the `LibraryItem.id` value. Each document's fields SHALL mirror the `LibraryItem` shape.

#### Scenario: Each item is one document
- **WHEN** a user has three Library items with ids `x`, `y`, `z`
- **THEN** Firestore has three documents at `users/{uid}/library/x`, `.../y`, `.../z`

#### Scenario: Firestore is the source of truth
- **WHEN** `LibraryProvider` mounts for a signed-in user
- **THEN** it SHALL subscribe to `users/{uid}/library` via `onSnapshot` AND SHALL NOT read from localStorage

### Requirement: useFirestoreCollection shared hook
The application SHALL provide a shared hook `useFirestoreCollection<T>(path, options)` in `src/hooks/useFirestoreCollection.ts`. The hook SHALL expose `items: T[]`, `addItem(item: T)`, `removeItem(id: string)`, `updateItem(id: string, partial: Partial<T>)`, and `status: 'idle' | 'saving' | 'saved' | 'error'`.

#### Scenario: Hook subscribes on mount
- **WHEN** `useFirestoreCollection('users/uid_A/library')` is mounted
- **THEN** an `onSnapshot` listener is created for that collection path
- **THEN** the initial snapshot populates `items`

#### Scenario: addItem writes immediately
- **WHEN** `addItem({ id: 'abc', ...rest })` is called
- **THEN** a Firestore write to `<path>/abc` is initiated without debounce

#### Scenario: removeItem deletes immediately
- **WHEN** `removeItem('abc')` is called
- **THEN** `deleteDoc(<path>/abc)` is initiated without debounce

#### Scenario: updateItem is debounced
- **WHEN** `updateItem('abc', { ...partial })` is called multiple times within the debounce window
- **THEN** exactly one `setDoc(..., partial, { merge: true })` fires after the window elapses, with the most-recent partial value

#### Scenario: Unmount flushes pending writes
- **WHEN** the hook unmounts while a debounced `updateItem` is pending
- **THEN** the pending write is flushed before the subscription is torn down

### Requirement: Library auto-seeds on first load for new users
When `LibraryProvider` detects that the subscribed Library collection for the current user is empty on initial mount, it SHALL write every entry from `DEFAULT_LIBRARY` to Firestore as a one-time seed. The seed SHALL NOT execute on subsequent mounts where the collection is non-empty.

#### Scenario: Brand-new user sees defaults
- **WHEN** a newly-signed-up user opens the Library for the first time and the collection at `users/{uid}/library` is empty
- **THEN** `DEFAULT_LIBRARY` entries are written to Firestore via `writeBatch`
- **THEN** the Library UI displays those entries after the snapshot arrives

#### Scenario: Existing user is not re-seeded
- **WHEN** a user with one or more items in `users/{uid}/library` loads the app
- **THEN** no seed write occurs AND the user's existing items are preserved

#### Scenario: User with emptied library is not re-seeded
- **WHEN** a user has deleted all their Library items and re-opens the app
- **THEN** the collection is empty but no seed occurs because the seed flag (first-mount detection) has already fired
- **Note:** seed is gated on first-mount-after-auth, not purely on emptiness. Once a user has had any Library state — even now-empty — seed does not re-run.

### Requirement: Library Firestore security rules
Firestore security rules SHALL allow read and write on `users/{userId}/library/{itemId}` only for the authenticated user matching `userId`. No cross-user reads; no unauthenticated access.

#### Scenario: Owner reads their library
- **WHEN** signed-in user `uid_A` reads `users/uid_A/library/{any}`
- **THEN** the read is allowed

#### Scenario: Non-owner cannot read another user's library
- **WHEN** signed-in user `uid_A` reads `users/uid_B/library/{any}`
- **THEN** the read is denied

#### Scenario: Unauthenticated access denied
- **WHEN** an unauthenticated request reads or writes `users/{uid}/library/{any}`
- **THEN** the request is denied

### Requirement: Library no longer uses localStorage
`LibraryContext` SHALL NOT call `loadState` or `saveState`. The `gamecraft:library` localStorage key SHALL NOT be read or written by any production code path.

#### Scenario: No localStorage reads on mount
- **WHEN** `LibraryProvider` mounts
- **THEN** no call to `localStorage.getItem('gamecraft:library')` occurs

#### Scenario: No localStorage writes on dispatch
- **WHEN** a Library mutation is dispatched
- **THEN** no call to `localStorage.setItem('gamecraft:library', ...)` occurs

## REMOVED Requirements

### Requirement: LibraryContext initializes from localStorage
**Reason:** Library is now Firestore-backed. `LibraryProvider` subscribes to `users/{uid}/library/*` via `onSnapshot`; `DEFAULT_LIBRARY` is written to Firestore on first mount for new users rather than used as a local fallback. Superseded by the new "Library persists to Firestore per-user subcollection" and "Library auto-seeds on first load for new users" requirements.
**Migration:** None. Existing `gamecraft:library` localStorage entries are abandoned. Users testing in dev see `DEFAULT_LIBRARY` re-seeded once on first sign-in to the new build.
