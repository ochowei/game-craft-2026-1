## Context

CardDesigner renders three hardcoded card objects in JSX with a static inspector sidebar. There's no state for which card is selected, no way to actually edit card data, and the Chance/Community Chest tabs don't filter anything. The DDD document defines Cards as: "Independent decks of cards, designed separately from the Board. Each card has its own content, visuals, and gameplay effect." The aggregate structure is Deck → Card (one-to-many). This is the first aggregate with entity relationships in the domain model (Rules was a single value object).

The Rules pilot established the pattern: domain types in `src/domain/`, React Context + useReducer in `src/contexts/`, UI components read from context and dispatch actions. This change follows the same pattern but introduces: (1) a collection of entities instead of a single value object, (2) a selected-item concept, and (3) deck-level filtering.

## Goals / Non-Goals

**Goals:**
- Define `Card` and `Deck` domain types with proper structure
- Manage card state (list, selection, editing) via context/reducer
- Make CardDesigner fully interactive: select cards, edit via inspector, switch decks
- Extract mock data into `DEFAULT_DECKS` seed constant
- Establish the collection-entity pattern for reuse by Board (tiles)

**Non-Goals:**
- Add/delete cards (the UI has an "Add New Card" button but wiring it is stretch — include if straightforward)
- Card reordering or drag-and-drop
- Persistence to Firestore/localStorage
- Card visual customization (Visuals/Logic tabs in inspector are placeholder)
- Connecting Cards to Board tile effects

## Decisions

### 1. Deck as a named collection vs separate entity

**Decision:** A `Deck` is a named collection object containing an array of `Card` entities, identified by `CardType` ('chance' | 'community-chest'). No separate Deck entity with its own ID — the deck type IS the identifier.

**Rationale:** The UI has exactly two decks (Chance, Community Chest) toggled by tabs. There's no UI for creating/naming custom decks. Using `CardType` as the key keeps things simple and matches the current tab structure.

**Alternative considered:** Full Deck entity with ID, name, metadata. Rejected as over-engineering for the current UI — can be introduced later if custom decks become a feature.

### 2. State shape: map of decks vs flat card array with type field

**Decision:** State holds a flat array of all cards (each card has a `type` field) plus `activeDeckType` and `selectedCardId`. Components filter by `activeDeckType`.

**Rationale:** A flat array is simpler for the reducer (update/add/remove operate on one array). The UI filters at render time. This matches the existing `Card` interface which already has a `type` field.

**Alternative considered:** `Record<CardType, Card[]>` map. More explicit but makes card operations require knowing which deck a card belongs to, complicating actions.

### 3. Selected card state: in context vs local component state

**Decision:** `selectedCardId` lives in CardsContext, not in CardDesigner's local state.

**Rationale:** The inspector needs to know which card is selected to display/edit its fields. If selection lived in local state, the inspector (which shares the same component tree) could still access it — but putting it in context prepares for future cases where other components might need to know the selected card (e.g., Board tile linking to a card).

### 4. Card ID generation

**Decision:** Use a simple counter-based ID scheme (`CHN-001`, `COM-001`) for seed data. For new cards (if add is implemented), use a timestamp-based ID.

**Rationale:** Matches the ID format already shown in the CardDesigner UI (`ID: CHN-004`). Human-readable during development. Real persistence will likely use Firestore document IDs later.

## Risks / Trade-offs

- **`Card` interface move from `types.ts` is breaking** → Grep confirms `Card` is only imported in `types.ts` itself. The existing interface is unused by components (CardDesigner hardcodes everything). Low risk.
- **Flat array filtering on every render** → With <100 cards total, array filter is negligible. No performance concern.
- **Inspector assumes a card is always selected** → Will default to selecting the first card in the active deck. If deck is empty, inspector shows empty state.
