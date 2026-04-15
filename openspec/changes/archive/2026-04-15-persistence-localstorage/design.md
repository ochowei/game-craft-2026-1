## Context

All five contexts use `useReducer(reducer, defaultState)`. The persistence pattern is: on mount, try loading from localStorage; on every state change, save to localStorage. This is a cross-cutting concern that touches all contexts the same way.

## Goals / Non-Goals

**Goals:**
- Persist domain data across page reloads
- Graceful fallback to defaults if localStorage is empty, corrupted, or unavailable
- Shared utility to avoid duplicating JSON parse/stringify/error handling
- Only persist the domain data arrays/objects, not transient UI state

**Non-Goals:**
- Firestore integration (future layer)
- Conflict resolution or merge logic
- Data migration between schema versions
- Debouncing saves (localStorage writes are fast enough for this scale)
- Persisting UI state (selected items, active filters)

## Decisions

### 1. Shared utility vs inline in each context

**Decision:** Create `src/lib/storage.ts` with `loadState<T>(key, fallback): T` and `saveState(key, data): void`.

**Rationale:** All five contexts need the same try/catch JSON parse/stringify logic. A shared utility eliminates duplication and centralizes error handling. The utility is ~15 lines, not an over-abstraction.

### 2. What to persist: full state vs domain data only

**Decision:** Persist only the domain data portion of each context's state:
- Rules: `rules` object
- Cards: `cards` array (not `activeDeckType`, `selectedCardId`)
- Board: `tiles` array (not `selectedTileId`)
- Tokens: `tokens` array (not `activeCategory`, `selectedTokenId`)
- Library: `items` array (not `activeFilter`)

**Rationale:** UI state (selections, filters) should reset on reload — they're ephemeral. Domain data is what the user created and expects to persist. This also avoids issues where a persisted `selectedCardId` references a card that was deleted.

### 3. Storage key naming

**Decision:** Use `gamecraft:rules`, `gamecraft:cards`, `gamecraft:board`, `gamecraft:tokens`, `gamecraft:library`.

**Rationale:** Namespaced prefix avoids collisions with other apps on the same origin. Short, readable keys for debugging in DevTools.

### 4. Save timing: useEffect on every state change

**Decision:** Each provider uses `useEffect(() => saveState(key, data), [data])` to save after every reducer dispatch.

**Rationale:** localStorage writes are synchronous and fast (<1ms for these data sizes). Debouncing adds complexity for no benefit. Board (40 tiles) is the largest dataset at ~15KB JSON — well within localStorage limits.

### 5. Rules RESET clears storage

**Decision:** When the Rules reducer handles RESET, the provider's useEffect will automatically save the default values back to localStorage (since the state changes to defaults).

**Rationale:** No special handling needed — the save-on-change pattern handles this automatically.

## Risks / Trade-offs

- **No data migration** → If the domain type shape changes in future, old localStorage data may fail to parse. Mitigated by the fallback-to-defaults behavior. A version field could be added later.
- **localStorage has a ~5MB limit** → Current data is well under 100KB total. Not a concern until we add image assets.
- **Synchronous localStorage blocks the main thread** → At these data sizes (<20KB per write), the blocking time is negligible.
