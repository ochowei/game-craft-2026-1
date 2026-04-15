## ADDED Requirements

### Requirement: Card domain type defines card structure
The system SHALL define a `Card` type with fields: `id` (string), `title` (string), `description` (string), `type` (CardType), `icon` (string), and `accentColor` (string).

#### Scenario: Card type fields
- **WHEN** a Card object is created
- **THEN** it SHALL contain all six fields with correct types

### Requirement: CardType defines deck categories
The system SHALL define a `CardType` as `'chance' | 'community-chest'`.

#### Scenario: Valid card types
- **WHEN** a Card is assigned a type
- **THEN** the type SHALL be either `'chance'` or `'community-chest'`

### Requirement: Default cards match current hardcoded values
The system SHALL provide a `DEFAULT_CARDS` constant containing the cards currently hardcoded in CardDesigner.

#### Scenario: Chance cards present
- **WHEN** DEFAULT_CARDS is used
- **THEN** it SHALL contain at least three Chance cards: "Advance to Go" (id CHN-004), "Go to Jail" (id CHN-012), and "Chairman of the Board" (id CHN-009)

#### Scenario: Card data matches mock
- **WHEN** the "Advance to Go" card is accessed from DEFAULT_CARDS
- **THEN** its title SHALL be "ADVANCE TO GO", icon SHALL be "rocket_launch", and type SHALL be "chance"

### Requirement: CardsContext provides state and dispatch
The system SHALL provide a `CardsContext` using React Context + useReducer that exposes cards state and a dispatch function.

#### Scenario: Context provides cards state
- **WHEN** a component calls `useCards()`
- **THEN** it SHALL receive `cards` (Card array), `activeDeckType` (CardType), and `selectedCardId` (string | null)

#### Scenario: Context provides dispatch
- **WHEN** a component calls `useCards()`
- **THEN** it SHALL receive a `dispatch` function for sending actions to the reducer

#### Scenario: Context initializes with defaults
- **WHEN** `CardsProvider` mounts
- **THEN** cards SHALL equal `DEFAULT_CARDS`, activeDeckType SHALL be `'chance'`, and selectedCardId SHALL be the first chance card's id

### Requirement: Cards reducer handles SELECT_CARD action
The reducer SHALL handle a `SELECT_CARD` action that sets the currently selected card.

#### Scenario: Select a card
- **WHEN** dispatch receives `{ type: 'SELECT_CARD', cardId: 'CHN-012' }`
- **THEN** `selectedCardId` SHALL become `'CHN-012'`

### Requirement: Cards reducer handles UPDATE_CARD action
The reducer SHALL handle an `UPDATE_CARD` action that updates a single field on the selected card.

#### Scenario: Update card title
- **WHEN** dispatch receives `{ type: 'UPDATE_CARD', cardId: 'CHN-004', field: 'title', value: 'GO TO START' }`
- **THEN** the card with id `'CHN-004'` SHALL have title `'GO TO START'` and all other cards SHALL remain unchanged

#### Scenario: Update card icon
- **WHEN** dispatch receives `{ type: 'UPDATE_CARD', cardId: 'CHN-004', field: 'icon', value: 'home' }`
- **THEN** the card with id `'CHN-004'` SHALL have icon `'home'`

### Requirement: Cards reducer handles SET_ACTIVE_DECK action
The reducer SHALL handle a `SET_ACTIVE_DECK` action that switches the active deck type.

#### Scenario: Switch to community chest
- **WHEN** dispatch receives `{ type: 'SET_ACTIVE_DECK', deckType: 'community-chest' }`
- **THEN** `activeDeckType` SHALL become `'community-chest'` and `selectedCardId` SHALL become the first community-chest card's id (or null if empty)

#### Scenario: Switch back to chance
- **WHEN** dispatch receives `{ type: 'SET_ACTIVE_DECK', deckType: 'chance' }`
- **THEN** `activeDeckType` SHALL become `'chance'` and `selectedCardId` SHALL become the first chance card's id

### Requirement: Cards reducer handles ADD_CARD action
The reducer SHALL handle an `ADD_CARD` action that adds a new card to the current deck.

#### Scenario: Add a new chance card
- **WHEN** dispatch receives `{ type: 'ADD_CARD' }` while activeDeckType is `'chance'`
- **THEN** a new Card SHALL be appended with type `'chance'`, a generated id, default title, and the new card SHALL become selectedCardId

### Requirement: Cards reducer handles DELETE_CARD action
The reducer SHALL handle a `DELETE_CARD` action that removes a card by id.

#### Scenario: Delete a card
- **WHEN** dispatch receives `{ type: 'DELETE_CARD', cardId: 'CHN-012' }`
- **THEN** the card with id `'CHN-012'` SHALL be removed from the cards array

#### Scenario: Delete selected card updates selection
- **WHEN** the deleted card was the selectedCardId
- **THEN** selectedCardId SHALL become the first card in the active deck (or null if empty)

### Requirement: CardDesigner reads from context
CardDesigner SHALL read the card list, selected card, and active deck from `useCards()` instead of hardcoded data.

#### Scenario: Card grid displays context cards
- **WHEN** CardDesigner renders
- **THEN** the card grid SHALL display cards filtered by `activeDeckType` from context

#### Scenario: Inspector displays selected card
- **WHEN** a card is selected
- **THEN** the inspector SHALL display the selected card's title, description, and icon from context

### Requirement: CardDesigner dispatches on user interaction
CardDesigner SHALL dispatch actions when the user interacts with cards.

#### Scenario: User clicks a card
- **WHEN** the user clicks a card in the grid
- **THEN** CardDesigner SHALL dispatch `SELECT_CARD` with that card's id

#### Scenario: User edits card title in inspector
- **WHEN** the user changes the Card Title input
- **THEN** CardDesigner SHALL dispatch `UPDATE_CARD` with the card's id, field 'title', and new value

#### Scenario: User switches deck tab
- **WHEN** the user clicks the "Community Chest" tab
- **THEN** CardDesigner SHALL dispatch `SET_ACTIVE_DECK` with deckType `'community-chest'`

### Requirement: CardsProvider wraps the application
`App.tsx` SHALL wrap the authenticated app content with `CardsProvider` so that CardDesigner can access Cards state.

#### Scenario: Provider in component tree
- **WHEN** the app renders for an authenticated user
- **THEN** `CardsProvider` SHALL be an ancestor of `CardDesigner` in the component tree
