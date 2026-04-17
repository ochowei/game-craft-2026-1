## Context

GameCraft today is an implicit single-project editor: each domain context (Rules, Cards, Board, Tokens, Library) reads and writes a single hardcoded localStorage key on mount / state change. Auth and Firestore are already wired (`src/lib/firebase.ts`, `AuthContext`), and a Firestore Emulator Suite is configured for local development. The domain model (`openspec/domain-model.md`) has reserved Project as the aggregate root for a while; nothing in code reflects it yet.

The Phase 1 goal is to land the Project aggregate **end-to-end** — schema, list UI, switching, and Firestore-backed persistence for the four design domains — in a single change. Phase 2 will layer sharing on top without a schema migration; Phases 3+ add History, Box, and Game.

## Goals / Non-Goals

**Goals:**

- Users can create, list, open, rename, and delete projects.
- The four design domains (Rules, Cards, Board, Tokens) persist to Firestore under the active project, with optimistic local updates and background sync.
- Switching projects fully resets editor state (open-file-like UX).
- Returning users land back in the last project they opened.
- Security rules enforce owner-only access with a membership primitive that extends cleanly to Phase 2 sharing.
- Offline editing works (Firestore offline persistence).
- First-login users are auto-provisioned with a starter project so the editor is never empty.

**Non-Goals:**

- Sharing / invites / membership UI (Phase 2).
- Migration of existing localStorage state (no production users).
- Migrating Library to Firestore (cross-project concern, deferred).
- React Router / shareable URLs (deferred; `useState` navigation is kept).
- Real-time cursors / presence (not planned).
- History snapshots, undo/redo, Box export, Game runtime (Phases 3+).

## Decisions

### 1. Top-level `projects/{projectId}` with owner + members map (Schema β)

Projects live at a top-level Firestore collection with `ownerId: string` and `members: { [uid]: Role }`. Phase 1 only ever writes `members[ownerId] = 'owner'`; no other roles exist yet.

**Why not nest under `users/{uid}/projects/{pid}`?** Nested collections tie a project's identity to its original creator. When sharing lands in Phase 2, a shared project would need to either live under every member's user doc (denormalized mess) or be migrated to a top-level collection (schema migration). Starting top-level avoids the migration, at the cost of slightly more verbose security rules.

**Why `members` as a map (not `memberIds: string[]`)?** Maps support per-member metadata (role, `addedAt`) without an auxiliary collection, and Firestore security rules can check `resource.data.members[request.auth.uid]` directly.

### 2. Reverse index at `users/{uid}/projectRefs/{projectId}`

Firestore cannot efficiently query "projects whose `members` map contains key X" — map-key queries on arbitrary maps are not supported. Options considered:

| Option | Query | Trade-off |
|---|---|---|
| `memberIds: string[]` + `where('memberIds', 'array-contains', uid)` | Simple | Loses per-member metadata |
| Reverse-index subcollection `users/{uid}/projectRefs/{pid}` | `getDocs(collection(…))` | Requires dual-write (transaction) |
| Cloud Function to maintain index | Automatic | Needs Functions infra, cold-start latency |

**Chosen:** reverse-index subcollection. It also gives a natural home for per-user, per-project state (`lastOpenedAt`, future pin/favorite) that doesn't belong on the project itself. Consistency is maintained via client-side `runTransaction` — acceptable for a single-user Phase 1.

### 3. Four separate design docs, not one

Each project has `design/board`, `design/cards`, `design/rules`, `design/tokens` as separate documents, not a single `design/main` blob.

**Why?**
- Firestore has a hard **1 MB per document** limit. A combined doc would risk hitting it as Cards / Boards accumulate assets.
- Editing one domain shouldn't rewrite the others (write amplification + `onSnapshot` re-render of unrelated contexts).
- Four domains, four providers — the storage boundary aligns with the existing code boundary.

### 4. Sync strategy: Firestore offline persistence + optimistic local state + 500 ms debounced writes (Direction Z)

The shared `useFirestoreDoc<T>` hook:

1. **Read once** on mount: `getDoc` → seed local reducer state (falls back to defaults if missing).
2. **Subscribe** via `onSnapshot` for external changes (other tab, other device). Incoming snapshots overwrite local state — last-write-wins.
3. **Write** on local change: 500 ms debounced `setDoc` with `{ merge: true }`. The SDK's offline queue handles disconnection.
4. **Status** callback (`saving | saved | error`) powers the `SaveIndicator`.

**Why not "Firestore is source of truth" (Direction X)?** Every reducer dispatch would round-trip to the SDK before rendering; even with offline cache, the extra latency is felt in hot paths like dragging tiles.

**Why not hand-rolled merge (Direction Y)?** GameCraft is a single-user editor in Phase 1; true concurrent-edit conflicts are rare (they only occur across tabs of the same user). Last-write-wins is acceptable and eliminates an entire class of merge code.

**Risk:** rapid edits across tabs can drop intermediate writes. Accepted for Phase 1; a future "presence" feature could add soft locking.

### 5. Project switch = remount via `key`

Switching the active project changes `activeProjectId`. The design providers are wrapped in `<ActiveProjectRoot key={activeProjectId}>…</ActiveProjectRoot>`, so React unmounts and remounts the whole subtree on switch.

**Why?** Each domain context owns a `useReducer` with initial state derived from Firestore for a specific `projectId`. Remounting guarantees no cross-project state leaks (no stale reducer state, no lingering debounce timers, no orphan `onSnapshot` subscriptions). It also matches the "open-file" mental model — closing File A and opening File B resets the workspace.

**Trade-off:** undo history (not in Phase 1) would reset across switches. That's actually the expected behavior for an open-file UX, so it aligns with Phase 4+ History design.

### 6. Save behavior: auto-save, no explicit "Close"

Clicking the `Projects` nav item auto-saves pending writes (flushes debounce), then routes to `ProjectListScreen`. There is no modal "close without saving?" prompt; all edits are already persisted (or queued offline). `SaveIndicator` shows `Saving…` during flush and `Saved just now` when idle.

**Why?** Matches Google Docs / Figma / Notion conventions; avoids a destructive-action dialog that doesn't apply (we never lose edits intentionally).

### 7. Last-opened memory on the profile document

`users/{uid}/profile/main` gains an optional `lastOpenedProjectId: string`. On login, if the field is present and the referenced project still exists and the user is a member, route directly to that project. Otherwise show `ProjectListScreen`.

**Why on `profile/main` and not `projectRefs/{pid}.lastOpenedAt`?** One document read on login is simpler than aggregating across refs to find the most recent. `projectRefs` can still carry `lastOpenedAt` later for a "recent projects" panel if desired.

### 8. First-login auto-provisioning

When `projectRefs` is empty on login, create `My First Project` automatically (inside the same transaction that would create any project), then open it.

**Why?** Eliminates the empty-state ("you have no projects") screen for a first-time user who just signed in — they land straight in the editor, which matches their expectation from the existing single-project experience.

### 9. Library stays on localStorage for Phase 1

Library is already a cross-project construct in the domain model and doesn't block Project introduction. Moving it to Firestore is a separate concern (affects `library-domain-model`, needs its own security rules, and is arguably per-user).

**Why defer?** Phase 1 is already large. Library-to-Firestore can be a small follow-up change. Risk: a user's Library becomes device-local until then — acceptable because Library is small and regenerable.

### 10. No migration code

There are no production users. Abandoning the existing `gamecraft:{rules,cards,board,tokens}` localStorage keys saves a migration path, error handling for partial migration, and version-compatibility code. Library's localStorage key is untouched.

## Risks / Trade-offs

- **[Firestore offline persistence]** — Phase 1 enables `persistentLocalCache`. First-load UX is fine (read once, seed reducer), but initial mount must handle "no doc yet" gracefully (new project case).
- **[Transaction failure during project create]** — Creating a project writes both `projects/{pid}` and `users/{uid}/projectRefs/{pid}`. A transaction failure (rules, network, quota) must not leave an orphan. Handled via `runTransaction`; on rollback, the caller surfaces an error.
- **[Multi-tab LWW drops]** — Rapid edits from two tabs of the same user can drop intermediate writes. Accepted; presence/locking is out of scope.
- **[Library device-local inconsistency]** — Until Library moves to Firestore, a user editing on device A and B will see different Library contents. Acceptable for Phase 1; flagged in Non-Goals.
- **[Security rule complexity]** — The `isMember` primitive wraps `resource.data.members[auth.uid] != null`. Phase 1 never writes non-owner members, so effectively `isMember == isOwner`, but the rule is written in terms of membership so Phase 2 extends without changes.
- **[SaveIndicator truthiness]** — `Saved just now` is UI-level optimism: it shows when the debounce flush resolves, not when the server acknowledges. In offline mode, the write is queued but the UI still says "Saved". This is intentional (matches Google Docs offline UX) but documented.
- **[schemaVersion on project]** — Each project stores `schemaVersion: 1`. Future schema changes can branch on this without breaking Phase 1 projects.
