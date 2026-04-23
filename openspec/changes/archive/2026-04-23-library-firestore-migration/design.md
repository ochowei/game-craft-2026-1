## Context

`LibraryContext` today initializes from `localStorage` (`gamecraft:library` key) and writes back on every state change via `saveState`. Seed data `DEFAULT_LIBRARY` is returned as a fallback when the key is missing. The context exposes:

- `items: LibraryItem[]` — flat array of Library entries (card templates / tile presets / color palettes)
- `activeFilter: LibraryItemType | 'all'` — UI-only filter selection
- `dispatch` — `ADD_ITEM`, `REMOVE_ITEM`, `SET_FILTER`

All four design domains (Rules/Cards/Board/Tokens) already persist to Firestore via `useFirestoreDoc`. Library is the last localStorage holdout; moving it closes the migration started in Phase 1.

## Goals / Non-Goals

**Goals:**

- Library state persists to Firestore under the current user, per-item.
- Library changes on one device appear on another within ~1 s (real-time via `onSnapshot`).
- A new user's Library is auto-seeded with `DEFAULT_LIBRARY` on first load, so the screen is never empty for a first-time experience.
- No data loss for users who already have a populated Library (within Firestore). Existing `localStorage` data is intentionally abandoned — no production users.
- Firestore security rules enforce that a user can only read/write their own Library.

**Non-Goals:**

- Cross-user Library sharing (deferred; not aligned with the domain model's "user's personal collection" framing).
- Data migration from `localStorage` to Firestore for pre-existing users (no production deployments with real Library data).
- Real-time collaborative Library editing (Library has no editing UI in Phase 2; it's add/remove only).
- Library versioning / Undo. That belongs to the forthcoming History capability.

## Decisions

### 1. Subcollection per user, not a single document

Library items live at `users/{uid}/library/{itemId}`, one Firestore document per `LibraryItem`. The alternative — a single document at `users/{uid}/library/main` storing `items: LibraryItem[]` — was rejected.

**Why a subcollection:**

- **1 MB document limit** — even modest usage (20+ card templates with rich `data` payloads) could approach the limit. A subcollection sidesteps it entirely.
- **Write amplification** — a single doc forces every add/remove/update to rewrite the full `items` array. With a subcollection, adding one item is one small `setDoc`; removing is one `deleteDoc`. No read-modify-write cycle.
- **Granular `onSnapshot`** — each item changes independently, so UI updates are targeted rather than a full array replacement.
- **Security rules stay simple** — `match /users/{userId}/library/{itemId}: if isOwner(userId)` covers the whole collection.

The trade-off is that we need a new hook (`useFirestoreCollection`) rather than reusing `useFirestoreDoc`. That cost is paid once and unlocks future collection-backed features (Version Snapshots, Game history, etc.).

### 2. `useFirestoreCollection` hook — new shared primitive

Mirrors `useFirestoreDoc` in shape but operates on a collection:

```
useFirestoreCollection<T>(path, {
  idField: 'id',         // which field in T to use as Firestore doc ID
  debounceMs: 500,       // debounce window for rapid edits on a single item
}) → {
  items: T[],
  addItem: (item: T) => Promise<void>,
  removeItem: (id: string) => Promise<void>,
  updateItem: (id: string, partial: Partial<T>) => Promise<void>,
  status: 'idle' | 'saving' | 'saved' | 'error',
}
```

Contract:

- **Mount:** `onSnapshot(collection(path))` → incremental local state updates (one event per changed doc, not a full re-fetch).
- **`addItem`:** immediate `setDoc(doc(path, item[idField]), item)` — not debounced; adds are discrete user actions.
- **`removeItem`:** immediate `deleteDoc(doc(path, id))` — same rationale.
- **`updateItem`:** debounced (for future in-place edits). Library doesn't use it in this phase but the hook stays general.
- **Unmount:** flush pending updates, unsubscribe.
- **Status:** surfaces the worst of the in-flight/recent operations, same as `useFirestoreDoc`, so `SaveIndicator` can aggregate.

### 3. Seed handling — first-load write, not lazy fallback

When the `onSnapshot` first delivers an **empty** collection for a signed-in user, the provider writes every entry from `DEFAULT_LIBRARY` to Firestore in a batch. Subsequent snapshots show those seeded items.

**Why not "seed as local fallback":**

- If the current approach (fallback) is kept, the UI still shows default items, but they're not in Firestore. Removing one locally can't be persisted. That's fundamentally broken.

**Why not "always seed":**

- Would overwrite an existing user's Library on every load. Must gate on `empty collection`.

**Seed write uses `writeBatch`** for atomicity — all defaults land together, with `createdAt` serverTimestamp where applicable. If the batch fails (rules, network), the hook surfaces the error via `status` and retries on next mount; worst case the user sees an empty Library screen (not fatal).

**A subtle race:** two tabs opened simultaneously by a brand-new user might both decide to seed. The fix: the seed batch uses `setDoc(...)` with `{ merge: false }` on each entry; the second tab's writes win (identical seed content anyway), no duplicates because document IDs are deterministic (the `id` field from `DEFAULT_LIBRARY`). Accepted as benign.

### 4. Security rules — owner-only

```
match /users/{userId}/library/{itemId} {
  allow read, write: if isOwner(userId);
}
```

No cross-user read access, no public sharing in this phase. Matches the domain model's user-owned framing.

### 5. No localStorage fallback / migration path

No production users. No migration code. No dual-write. The old `gamecraft:library` key is simply ignored — if a developer has local state there, it stays in their browser but is never read.

After this change, no code path calls `loadState('gamecraft:library', ...)`. The `saveState` / `loadState` functions in `src/lib/storage.ts` become unused; we leave them in place for a possible follow-up removal but stop exporting them from Library.

### 6. `LibraryProvider` needs `uid`

Library is per-user. The provider must know the current uid to compute the Firestore path. It reads `user` from `useAuth()` at the top of the provider; if `user` is null, the provider renders children with an empty `items: []` and a no-op dispatch. This mirrors how the app already handles unauthenticated state (no design context is available without auth either).

Because `LibraryProvider` sits **outside** `ProjectProvider` (Library is cross-project), it can safely read `useAuth()` without ordering problems — `AuthProvider` wraps everything.

### 7. UI-only filter state stays local

`activeFilter` is not persisted. It's a UI selection that resets per session. This matches the convention set by the design domains (no UI state in Firestore).

## Risks / Trade-offs

- **[Seed duplication across tabs]** — Two fresh-login tabs could both attempt the initial seed. Mitigated by deterministic seed IDs (`setDoc` with the same ID is idempotent). Accepted.
- **[Snapshot latency spike on first load]** — The first `onSnapshot` emission happens after the Firestore connection is established; users may briefly see an empty Library skeleton. The design hides this by keeping the existing loading state, same as how Project switching currently feels.
- **[Rule deployment coupling]** — The new rules for `users/{userId}/library/{itemId}` must be deployed before production users sign in, or their reads will be denied. Mitigated by shipping `firestore.rules` changes in the same PR and documenting the deploy step in tasks.
- **[`useFirestoreCollection` generality]** — Designed for future reuse, but only Library uses it in this PR. Risk: over-engineered for one caller. Accepted because the API surface is small and the cost of matching `useFirestoreDoc`'s contract is low.
- **[Abandoning localStorage data]** — A developer with valuable Library content in `gamecraft:library` loses it on upgrade. Acceptable per non-goals; can be mitigated by a one-time export-to-JSON button, deferred.
- **[Library size limits]** — Firestore charges per document read; a Library with hundreds of items will read all of them on every app load. Mitigated by `onSnapshot`'s single-subscription pricing and Firestore's incremental updates. If Library grows to thousands of items, pagination is a future concern, not a Phase 3 concern.
