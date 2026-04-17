## ADDED Requirements

### Requirement: Firestore offline persistence enabled
The Firebase Firestore instance SHALL be initialized with `persistentLocalCache` so that reads and writes are cached locally and writes are queued while offline. This applies to both production and emulator connections.

#### Scenario: Edits while offline are queued
- **WHEN** the user loses network connectivity and edits a design document
- **THEN** the local state updates optimistically AND the Firestore SDK queues the write for delivery on reconnect

#### Scenario: Initial load hits local cache
- **WHEN** the app reopens with cached project data
- **THEN** Firestore reads resolve from the local cache without requiring a round-trip (though `onSnapshot` still syncs with the server when online)

### Requirement: useFirestoreDoc shared sync hook
The application SHALL provide a shared hook `useFirestoreDoc<T>(path, { defaults, reducer, debounceMs })` in `src/hooks/useFirestoreDoc.ts` that encapsulates the Firestore sync pattern used by every domain context. The hook SHALL:

1. On mount, read the document at `path` via `getDoc`. If the document does not exist, seed local state with `defaults`.
2. Subscribe to the document via `onSnapshot`. Incoming snapshots SHALL overwrite local state (last-write-wins).
3. On local state change, schedule a debounced `setDoc(path, value, { merge: true })` with the configured `debounceMs` (default 500).
4. Expose `state`, `dispatch`, and a sync-status signal (`idle | saving | saved | error`).
5. On unmount, flush any pending debounced write and unsubscribe.

#### Scenario: Hook seeds from defaults when doc missing
- **WHEN** `useFirestoreDoc` mounts and the document does not exist
- **THEN** the initial state equals the `defaults` value

#### Scenario: Local edit triggers debounced write
- **WHEN** the reducer dispatches a change
- **THEN** the local state updates immediately
- **THEN** a `setDoc` call fires after the debounce window elapses

#### Scenario: Rapid edits coalesce into a single write
- **WHEN** the user dispatches 5 changes within 200 ms and `debounceMs` is 500
- **THEN** exactly one `setDoc` call occurs, containing the final state

#### Scenario: External change via onSnapshot replaces local state
- **WHEN** another tab writes a new value to the document
- **THEN** the subscribed tab receives the snapshot AND replaces its local state with the incoming value

#### Scenario: Unmount flushes pending write
- **WHEN** the hook unmounts while a debounced write is scheduled
- **THEN** the write is flushed before the subscription is torn down

### Requirement: Domain contexts persist to Firestore
`RulesProvider`, `CardsProvider`, `BoardProvider`, and `TokensProvider` SHALL use `useFirestoreDoc` to persist their respective state to `projects/{activeProjectId}/design/{rules|cards|board|tokens}` instead of localStorage. UI-only state (e.g., `selectedTileId`, `activeDeckType`, `activeCategory`) SHALL NOT be written to Firestore.

#### Scenario: RulesProvider persists to Firestore
- **WHEN** the user edits a rule field in project `p_1`
- **THEN** the new Rules document is debounced-written to `projects/p_1/design/rules`

#### Scenario: UI state is not persisted
- **WHEN** the user changes `selectedTileId` without modifying any tile
- **THEN** no Firestore write is scheduled

#### Scenario: No active project means no providers
- **WHEN** `activeProjectId` is `null`
- **THEN** the design providers are not mounted AND no Firestore reads or writes occur for design documents

### Requirement: SaveIndicator UI component
The application SHALL provide a `SaveIndicator` component, visible in the Layout when a project is active, that displays the current sync status: `Saving…` while a write is in flight, `Saved just now` for a short window after the write resolves, and an error state if the write fails.

#### Scenario: Indicator shows "Saving..." during flush
- **WHEN** a debounced write is in flight
- **THEN** the indicator text is "Saving…"

#### Scenario: Indicator shows "Saved just now" after success
- **WHEN** the most recent write resolved within the last ~5 seconds and no write is pending
- **THEN** the indicator text is "Saved just now"

#### Scenario: Indicator shows error
- **WHEN** a Firestore write returns an error (e.g., permission denied)
- **THEN** the indicator displays an error state distinguishable from idle

### Requirement: Last-write-wins merge across tabs
The sync hook SHALL NOT attempt to merge concurrent edits between tabs or devices. The most recent server write SHALL overwrite any earlier local or remote state delivered via `onSnapshot`.

#### Scenario: Two tabs edit the same document
- **WHEN** Tab A writes value V1 at time T1 and Tab B writes V2 at time T2 (T2 > T1)
- **THEN** the final document state is V2 AND Tab A observes V2 via `onSnapshot` at some point after T2

### Requirement: Sync aligns to active project boundary
The sync hook subscriptions SHALL be created for a specific `activeProjectId` and SHALL be torn down when that id changes. Because the design providers are remounted via `key={activeProjectId}`, this tear-down is a natural consequence of unmount.

#### Scenario: Subscriptions do not leak across projects
- **WHEN** the user switches from project `p_1` to `p_2`
- **THEN** all `onSnapshot` listeners for `p_1` design documents are unsubscribed
- **THEN** new listeners are created for `p_2` design documents
