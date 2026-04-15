## Why

The current `TemplateLibrary` component is an official template gallery (curated maps with downloads, likes, difficulty ratings, external images). The DDD document defines Library as: "The user's personal collection of reusable components. Stores custom card styles, tile configurations, Token templates, and other design elements that can be reused across Projects. Library is user-created content, not official/built-in templates." The DDD doc explicitly flags this mismatch: "currently implemented as TemplateLibrary (official templates); needs repositioning to match this definition."

This change replaces the template gallery with a personal component library where users can save and reuse their own design elements — card templates, tile presets, and color palettes.

## What Changes

- Define `LibraryItem` domain type in `src/domain/library.ts` with variants for different component types (card-template, tile-preset, color-palette)
- Create `LibraryContext` using React Context + useReducer with actions for: adding items, removing items, filtering by type
- Replace `TemplateLibrary` component with a new `Library` component showing the user's saved components in a grid, organized by type tabs
- Provide "Save to Library" affordance concept (the actual save-from-editor wiring is future work)
- Remove community/marketplace concepts (downloads, likes, difficulty, author) — those don't belong to a personal library
- Rename component file from `TemplateLibrary.tsx` to `Library.tsx`
- Include a few seed items so the library isn't empty on first load

## Capabilities

### New Capabilities
- `library-domain-model`: Domain type definitions, default seed state, and React Context/reducer for the Library (user's personal reusable component collection)

### Modified Capabilities

## Impact

- `src/domain/library.ts` — new file with `LibraryItem`, `LibraryItemType` types and `DEFAULT_LIBRARY`
- `src/contexts/LibraryContext.tsx` — new file with `LibraryProvider`, `useLibrary` hook, and reducer
- `src/components/TemplateLibrary.tsx` — deleted, replaced by `src/components/Library.tsx`
- `src/App.tsx` — update import from TemplateLibrary to Library, wrap with `LibraryProvider`
- No external dependency changes
