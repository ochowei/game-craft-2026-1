## Why

CardDesigner currently hardcodes three mock cards directly in JSX, with no backing state for the card list, selected card, or deck switching. The existing `Card` interface in `types.ts` is defined but unused by any context or state management. The DDD document defines Cards as an aggregate within the Design Context: a Project contains N Decks, each Deck contains N Cards. This change applies the same domain layer pattern established by the Rules pilot (domain type → context/reducer → UI binding) to the Cards aggregate, introducing the first one-to-many relationship in the domain model.

## What Changes

- Define domain types for `Card` and `Deck` in `src/domain/cards.ts`, with `CardType` enum for deck categorization (Chance, Community Chest)
- Create `DEFAULT_DECKS` seed data extracted from current CardDesigner mock values
- Create a `CardsContext` using React Context + `useReducer` with actions for: selecting a card, updating card fields, switching active deck, adding/removing cards
- Refactor `CardDesigner` to read card list, selected card, and active deck from context instead of hardcoded JSX
- Wire the inspector form fields to dispatch update actions
- Wire the Chance/Community Chest tabs to switch active deck
- Move the `Card` interface from `types.ts` to `src/domain/cards.ts` with enhanced structure

## Capabilities

### New Capabilities
- `cards-domain-model`: Domain type definitions, default state, and React Context/reducer for the Cards aggregate (Deck → Card relationship)

### Modified Capabilities

## Impact

- `src/types.ts` — `Card` interface removed (moved to domain layer)
- `src/domain/cards.ts` — new file with `Card`, `Deck`, `CardType` types and `DEFAULT_DECKS`
- `src/contexts/CardsContext.tsx` — new file with `CardsProvider`, `useCards` hook, and reducer
- `src/components/CardDesigner.tsx` — refactored from static mock to context-driven
- `src/App.tsx` — wrap with `CardsProvider`
- No external dependency changes
