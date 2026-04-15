## Context

Tokens is the broadest category in the DDD document — "all game objects that are neither board tiles nor cards." For a Monopoly-style game, this covers: player pieces (top hat, car, dog, etc.), currency denominations ($1, $5, $10, etc.), dice, houses, hotels, and any score/status markers. Unlike Board (fixed 40-tile layout) or Cards (deck-based), Tokens are a flat collection with no structural relationships between items.

The established pattern is: domain types in `src/domain/`, React Context + useReducer in `src/contexts/`, UI reads from context. The UI pattern closest to Tokens is the Cards editor (collection + selection + inspector), since both deal with a filterable list of items with an inspector panel.

## Goals / Non-Goals

**Goals:**
- Define `Token` type with: id, name, category, icon, description, quantity, and optional properties (value for currency, sides for dice)
- Define `TokenCategory` covering the DDD document's categories: pawn, currency, dice, marker
- Create seed data with typical Monopoly tokens (~15 items)
- Build TokensEditor following the Cards editor pattern: category tabs, token grid, inspector sidebar/bottom sheet
- Support add, edit, and delete operations

**Non-Goals:**
- Custom image/asset upload for tokens (DDD doc mentions "associated assets" but that requires file handling — future work)
- Token physics or 3D preview
- Connecting tokens to Board or Rules (e.g., house/hotel placement on tiles)
- Persistence

## Decisions

### 1. Token type: shared interface with optional fields vs discriminated union

**Decision:** Shared `Token` interface with `category` field and optional category-specific fields (`value` for currency, `sides` for dice).

**Rationale:** Consistent with the Board tile approach. Token categories differ in a few optional fields, not fundamentally different shapes. Keeps the reducer simple.

### 2. TokenCategory values

**Decision:** Four categories: `'pawn'`, `'currency'`, `'dice'`, `'marker'`. Maps directly to the DDD document's list.

**Rationale:** "Houses" and "hotels" are markers (they mark property improvement status). Player pieces are pawns. Bills/coins are currency. This covers all Monopoly components.

### 3. UI layout: Cards editor pattern (tabs + grid + inspector)

**Decision:** Reuse the same layout pattern as CardDesigner: category filter tabs at top, scrollable grid of token cards, inspector sidebar on desktop / bottom sheet on mobile.

**Rationale:** Consistent UX across editors. Users learn one pattern. The token grid shows icon + name + quantity. Inspector shows editable fields for the selected token.

### 4. Quantity field

**Decision:** Each token has a `quantity` field (e.g., 6 player pawns, 32 houses, 2 dice).

**Rationale:** Tokens represent game components that exist in specific quantities. This is a natural property that other editors don't need (there's one board, cards are in decks with implicit quantity).

## Risks / Trade-offs

- **No image upload limits expressiveness** → Material icons serve as placeholders. The DDD doc envisions asset management within the Tokens editor, but that's a separate feature requiring file upload infrastructure.
- **"Marker" is a catch-all category** → Houses, hotels, score trackers, and miscellaneous components all fall here. If the list grows, sub-categories could help, but for now a flat category is sufficient.
- **Seed data is Monopoly-specific** → Acceptable since the whole app is prototyping a Monopoly variant. The domain model is generic enough for other games.
