## Why

All five domain contexts (Rules, Cards, Board, Tokens, Library) currently initialize from hardcoded defaults on every page load. Any edits are lost on reload. This makes the editors unusable for real work — users expect their changes to persist. localStorage is the simplest persistence layer that works without backend infrastructure, and can be replaced or supplemented by Firestore later.

## What Changes

- Create a shared `src/lib/storage.ts` utility with `loadState<T>(key, fallback)` and `saveState<T>(key, state)` functions that handle JSON serialization, error handling, and localStorage access
- Modify all five context providers to:
  - Initialize state from localStorage (falling back to defaults if not found or corrupted)
  - Auto-save state to localStorage on every change via `useEffect`
- Each context gets a unique storage key (e.g., `gamecraft:rules`, `gamecraft:cards`, etc.)
- Only persist domain data, not UI state (e.g., `selectedCardId` and `activeDeckType` are NOT persisted — they reset on reload)
- Rules RESET action also clears localStorage for rules

## Capabilities

### New Capabilities
- `localstorage-persistence`: Shared storage utility and auto-save/load integration for all domain contexts

### Modified Capabilities

## Impact

- `src/lib/storage.ts` — new shared utility
- `src/contexts/RulesContext.tsx` — load/save rules
- `src/contexts/CardsContext.tsx` — load/save cards array
- `src/contexts/BoardContext.tsx` — load/save tiles array
- `src/contexts/TokensContext.tsx` — load/save tokens array
- `src/contexts/LibraryContext.tsx` — load/save library items array
- No external dependency changes
