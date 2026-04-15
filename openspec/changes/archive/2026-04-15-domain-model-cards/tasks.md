## 1. Domain Layer

- [x] 1.1 Create `src/domain/cards.ts` with `Card`, `CardType` types, and `DEFAULT_CARDS` seed data extracted from CardDesigner mock values
- [x] 1.2 Remove the `Card` interface from `src/types.ts`

## 2. State Management

- [x] 2.1 Create `src/contexts/CardsContext.tsx` with `CardsProvider`, `useCards` hook, and reducer handling `SELECT_CARD`, `UPDATE_CARD`, `SET_ACTIVE_DECK`, `ADD_CARD`, `DELETE_CARD` actions
- [x] 2.2 Wrap authenticated app content in `App.tsx` with `CardsProvider`

## 3. UI Binding

- [x] 3.1 Refactor CardDesigner card grid to render cards from context filtered by activeDeckType
- [x] 3.2 Wire card click to dispatch `SELECT_CARD`, highlight selected card
- [x] 3.3 Wire Chance/Community Chest tabs to dispatch `SET_ACTIVE_DECK`
- [x] 3.4 Wire inspector form fields (title, description) to dispatch `UPDATE_CARD` on change
- [x] 3.5 Wire inspector icon grid to dispatch `UPDATE_CARD` on icon selection
- [x] 3.6 Wire "Add New Card" slot to dispatch `ADD_CARD`

## 4. Verification

- [x] 4.1 TypeScript compiles clean, production build succeeds
- [x] 4.2 Verify card grid displays default cards, switching tabs filters by deck type
- [x] 4.3 Verify selecting a card updates inspector, editing inspector fields updates card in grid
