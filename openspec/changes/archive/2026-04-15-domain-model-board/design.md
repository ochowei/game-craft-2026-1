## Context

BoardEditor renders a hardcoded 11x11 grid in JSX with only the top row and corners having any tile data. The inspector sidebar shows static values for "Ventnor Avenue" ($260 buy price, rent structure, yellow color group). There is no tile selection, no editing, and the grid cells are mostly empty placeholders. The DDD document defines Board as containing Tiles with layout position, appearance, and effects. A standard Monopoly board has 40 tiles arranged around the perimeter of a square.

The Rules and Cards domain models established the pattern: domain types in `src/domain/`, React Context + useReducer in `src/contexts/`, UI reads from context and dispatches actions. Board follows the same pattern but is more complex: tiles have position-dependent rendering (corners, sides), multiple property types (property, railroad, utility, tax, card-draw, special), and a rent structure that varies by tile type.

## Goals / Non-Goals

**Goals:**
- Define `Tile` type covering all Monopoly tile types (property, railroad, utility, tax, chance/community-chest, go, jail, free-parking, go-to-jail)
- Define `RentStructure` for property tiles (base rent through hotel)
- Define `ColorGroup` enum for property color grouping
- Create `DEFAULT_BOARD` with all 40 tiles in standard Monopoly layout
- Implement `BoardContext` with tile selection and field editing
- Refactor BoardEditor grid to render from context, inspector to edit selected tile
- Cross-reference Cards domain via `TileEffect`

**Non-Goals:**
- Custom board layouts or tile count changes (fixed 40-tile ring)
- Drag-and-drop tile reordering
- Board visual editor (tile appearance customization beyond color group)
- Tile effect execution logic (just data modeling)
- Persistence

## Decisions

### 1. Tile type: discriminated union vs shared interface with optional fields

**Decision:** Use a shared `Tile` interface with a `tileType` field and optional type-specific fields (`colorGroup`, `price`, `rent` are optional, present only for property tiles).

**Rationale:** The BoardEditor inspector conditionally shows fields based on tile type. A discriminated union would be type-safer but makes the reducer significantly more complex (need to narrow types in every action handler). Optional fields with a `tileType` discriminator keeps the reducer simple and matches how the UI conditionally renders sections. At 40 tiles with a limited set of types, the trade-off favors simplicity.

**Alternative considered:** Full discriminated union (`PropertyTile | RailroadTile | ...`). Rejected for reducer complexity — revisit if tile-type-specific logic grows.

### 2. Board layout: position index vs row/col coordinates

**Decision:** Each tile has a numeric `position` (0-39) following the clockwise Monopoly convention (0 = GO, proceeding clockwise). The grid rendering maps position to row/col for the 11x11 CSS grid.

**Rationale:** Position is the canonical identifier in Monopoly. The 11x11 grid is a UI concern — mapping position to grid coordinates belongs in the rendering layer, not the domain. This makes the domain model independent of visual layout.

### 3. State shape: flat tile array with selectedTileId

**Decision:** State holds a flat `tiles: Tile[]` array plus `selectedTileId: number | null` (the position index).

**Rationale:** Follows the same pattern as Cards (`cards[]` + `selectedCardId`). Position serves as the natural ID for tiles (each position is unique on the board).

### 4. RentStructure as a nested object

**Decision:** Property tiles have an optional `rent: RentStructure` with fields: `base`, `oneHouse`, `twoHouses`, `threeHouses`, `fourHouses`, `hotel`.

**Rationale:** Matches the inspector UI which displays rent at each house level. Keeping it as a structured object (not an array) makes field-level updates straightforward with the existing `UPDATE_TILE` action pattern.

### 5. TileEffect cross-domain reference

**Decision:** `TileEffect` is a simple type: `{ type: 'drawCard'; deckType: CardType }` or `{ type: 'payTax'; amount: number }` etc. It imports `CardType` from `src/domain/cards.ts`.

**Rationale:** The DDD document says "Board tiles reference Cards through a draw action." This is a lightweight reference (just the deck type string), not a tight coupling. The Cards domain doesn't need to know about Board.

## Risks / Trade-offs

- **40-tile seed data is verbose** → Accepted. It's a one-time definition that accurately represents the standard board. Can be generated programmatically later if needed.
- **Optional fields on Tile reduce type safety** → Mitigated by `tileType` field. The UI already conditionally renders based on tile type, so runtime checks are natural.
- **Grid position-to-coordinate mapping adds rendering complexity** → Isolated in a helper function. The domain stays clean.
