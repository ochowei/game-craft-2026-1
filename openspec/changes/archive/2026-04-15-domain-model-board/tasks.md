## 1. Domain Layer

- [x] 1.1 Create `src/domain/board.ts` with `Tile`, `TileType`, `ColorGroup`, `RentStructure`, `TileEffect` types
- [x] 1.2 Create `DEFAULT_BOARD` constant with all 40 tiles in standard Monopoly layout
- [x] 1.3 Create a `positionToGridCoords` helper for mapping tile position (0-39) to 11x11 CSS grid row/col

## 2. State Management

- [x] 2.1 Create `src/contexts/BoardContext.tsx` with `BoardProvider`, `useBoard` hook, and reducer handling `SELECT_TILE`, `UPDATE_TILE`, `UPDATE_RENT` actions
- [x] 2.2 Wrap authenticated app content in `App.tsx` with `BoardProvider`

## 3. UI Binding

- [x] 3.1 Refactor BoardEditor grid to render tiles from context using positionToGridCoords mapping
- [x] 3.2 Wire tile click to dispatch `SELECT_TILE`
- [x] 3.3 Wire inspector form fields (name, price, mortgage) to dispatch `UPDATE_TILE` on change
- [x] 3.4 Wire inspector rent fields to dispatch `UPDATE_RENT` on change
- [x] 3.5 Wire inspector color group selector to dispatch `UPDATE_TILE` on change

## 4. Verification

- [x] 4.1 TypeScript compiles clean, production build succeeds
- [x] 4.2 Verify board grid renders all 40 tiles with correct layout and colors
- [x] 4.3 Verify selecting a tile updates inspector, editing inspector fields updates tile data
