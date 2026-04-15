## 1. Shared Utility

- [x] 1.1 Create `src/lib/storage.ts` with `loadState<T>(key, fallback)` and `saveState(key, data)` functions

## 2. Context Integration

- [x] 2.1 Update `RulesContext.tsx`: load rules from localStorage on init, save on change
- [x] 2.2 Update `CardsContext.tsx`: load cards array from localStorage on init, save on change
- [x] 2.3 Update `BoardContext.tsx`: load tiles array from localStorage on init, save on change
- [x] 2.4 Update `TokensContext.tsx`: load tokens array from localStorage on init, save on change
- [x] 2.5 Update `LibraryContext.tsx`: load items array from localStorage on init, save on change

## 3. Verification

- [x] 3.1 TypeScript compiles clean, production build succeeds
- [x] 3.2 Verify data persists across page reload for all five contexts
