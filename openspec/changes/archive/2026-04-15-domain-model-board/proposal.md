## Why

BoardEditor currently hardcodes all tile data directly in JSX — the grid layout, selected tile inspector values (Ventnor Avenue, $260), rent structure, and color groups are all static. There is no state management, no way to select different tiles, and no way to edit tile properties. The DDD document defines Board as an aggregate containing Tiles, where each Tile has layout position, appearance, and effects (including "draw card" actions that reference Card decks). This is the most complex aggregate in the Design Context, and completing it means all three core editors (Rules, Cards, Board) have a domain layer.

## What Changes

- Define domain types for `Board`, `Tile`, `TileType`, `TileEffect`, and `ColorGroup` in `src/domain/board.ts`
- Create `DEFAULT_BOARD` seed data representing a standard Monopoly-style board (40 tiles in the classic layout)
- Create a `BoardContext` using React Context + `useReducer` with actions for: selecting a tile, updating tile fields, updating rent values, changing color group
- Refactor `BoardEditor` to render the grid from context data, with tile selection driving the inspector
- Wire inspector form fields to dispatch update actions
- `TileEffect` type includes a `drawCard` variant that references `CardType` from the Cards domain

## Capabilities

### New Capabilities
- `board-domain-model`: Domain type definitions, default state, and React Context/reducer for the Board aggregate (Board → Tile relationship with tile types, effects, color groups, and rent structure)

### Modified Capabilities

## Impact

- `src/domain/board.ts` — new file with `Board`, `Tile`, `TileType`, `ColorGroup`, `TileEffect`, `RentStructure` types and `DEFAULT_BOARD`
- `src/contexts/BoardContext.tsx` — new file with `BoardProvider`, `useBoard` hook, and reducer
- `src/components/BoardEditor.tsx` — refactored from static mock to context-driven
- `src/App.tsx` — wrap with `BoardProvider`
- Cross-domain reference: `TileEffect.drawCard` imports `CardType` from `src/domain/cards.ts`
- No external dependency changes
