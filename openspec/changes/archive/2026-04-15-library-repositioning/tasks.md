## 1. Domain Layer

- [x] 1.1 Create `src/domain/library.ts` with `LibraryItem`, `LibraryItemType` types and `DEFAULT_LIBRARY` seed data
- [x] 1.2 Create `src/contexts/LibraryContext.tsx` with `LibraryProvider`, `useLibrary` hook, and reducer handling `ADD_ITEM`, `REMOVE_ITEM`, `SET_FILTER`

## 2. Component Replacement

- [x] 2.1 Create `src/components/Library.tsx` with filter tabs, item grid, type-specific previews, and delete action
- [x] 2.2 Delete `src/components/TemplateLibrary.tsx`
- [x] 2.3 Update `src/App.tsx`: replace TemplateLibrary import with Library, wrap with `LibraryProvider`

## 3. Verification

- [x] 3.1 TypeScript compiles clean, production build succeeds
- [x] 3.2 Verify Library displays seed items, filter tabs work, delete removes items
