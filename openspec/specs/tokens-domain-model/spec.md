## ADDED Requirements

### Requirement: TokenCategory defines component categories
The system SHALL define `TokenCategory` as `'pawn' | 'currency' | 'dice' | 'marker'`.

#### Scenario: Valid categories
- **WHEN** a Token is created
- **THEN** its `category` SHALL be one of the four defined categories

### Requirement: Token domain type defines token structure
The system SHALL define a `Token` type with fields: `id` (string), `name` (string), `category` (TokenCategory), `icon` (string), `description` (string), `quantity` (number), and optional fields `value` (number, for currency) and `sides` (number, for dice).

#### Scenario: Pawn token
- **WHEN** a Token with category `'pawn'` is created
- **THEN** it SHALL have name, icon, description, and quantity

#### Scenario: Currency token with value
- **WHEN** a Token with category `'currency'` is created
- **THEN** it SHALL have a `value` field representing the denomination

#### Scenario: Dice token with sides
- **WHEN** a Token with category `'dice'` is created
- **THEN** it SHALL have a `sides` field representing the number of faces

### Requirement: Default tokens contain Monopoly game pieces
The system SHALL provide a `DEFAULT_TOKENS` constant with representative tokens for a Monopoly-style game.

#### Scenario: All categories represented
- **WHEN** DEFAULT_TOKENS is used
- **THEN** it SHALL contain at least one token from each category (pawn, currency, dice, marker)

#### Scenario: Player pawns present
- **WHEN** DEFAULT_TOKENS is used
- **THEN** it SHALL contain multiple player pawn tokens with distinct icons

#### Scenario: Currency denominations present
- **WHEN** DEFAULT_TOKENS is used
- **THEN** it SHALL contain multiple currency tokens with different values

### Requirement: TokensContext provides state and dispatch
The system SHALL provide a `TokensContext` using React Context + useReducer that exposes tokens state and a dispatch function.

#### Scenario: Context provides tokens state
- **WHEN** a component calls `useTokens()`
- **THEN** it SHALL receive `tokens` (Token array), `activeCategory` (TokenCategory | 'all'), and `selectedTokenId` (string | null)

#### Scenario: Context initializes with defaults
- **WHEN** `TokensProvider` mounts
- **THEN** tokens SHALL equal `DEFAULT_TOKENS`, activeCategory SHALL be `'all'`, and selectedTokenId SHALL be the first token's id

### Requirement: Tokens reducer handles SELECT_TOKEN action
The reducer SHALL handle a `SELECT_TOKEN` action that sets the currently selected token.

#### Scenario: Select a token
- **WHEN** dispatch receives `{ type: 'SELECT_TOKEN', tokenId: 'some-id' }`
- **THEN** `selectedTokenId` SHALL become `'some-id'`

### Requirement: Tokens reducer handles UPDATE_TOKEN action
The reducer SHALL handle an `UPDATE_TOKEN` action that updates a field on the selected token.

#### Scenario: Update token name
- **WHEN** dispatch receives `{ type: 'UPDATE_TOKEN', tokenId: 'some-id', field: 'name', value: 'New Name' }`
- **THEN** the token with that id SHALL have name `'New Name'`

### Requirement: Tokens reducer handles SET_CATEGORY action
The reducer SHALL handle a `SET_CATEGORY` action that changes the active category filter.

#### Scenario: Filter by pawns
- **WHEN** dispatch receives `{ type: 'SET_CATEGORY', category: 'pawn' }`
- **THEN** `activeCategory` SHALL become `'pawn'` and `selectedTokenId` SHALL become the first pawn token's id (or null if empty)

### Requirement: Tokens reducer handles ADD_TOKEN action
The reducer SHALL handle an `ADD_TOKEN` action that adds a new token to the active category.

#### Scenario: Add a new pawn
- **WHEN** dispatch receives `{ type: 'ADD_TOKEN' }` while activeCategory is `'pawn'`
- **THEN** a new Token SHALL be appended with category `'pawn'` and become selected

### Requirement: Tokens reducer handles DELETE_TOKEN action
The reducer SHALL handle a `DELETE_TOKEN` action that removes a token by id.

#### Scenario: Delete a token
- **WHEN** dispatch receives `{ type: 'DELETE_TOKEN', tokenId: 'some-id' }`
- **THEN** the token SHALL be removed and selection SHALL update

### Requirement: TokensEditor displays tokens filtered by category
The TokensEditor SHALL display tokens from context filtered by the active category, with category tabs for filtering.

#### Scenario: All filter shows everything
- **WHEN** activeCategory is `'all'`
- **THEN** all tokens SHALL be displayed in the grid

#### Scenario: Category filter shows matching tokens
- **WHEN** user clicks the "Currency" tab
- **THEN** only currency tokens SHALL be displayed

### Requirement: TokensEditor has inspector for editing selected token
The TokensEditor SHALL display an inspector sidebar (desktop) or bottom sheet (mobile) showing editable fields for the selected token.

#### Scenario: Inspector shows token fields
- **WHEN** a token is selected
- **THEN** the inspector SHALL display editable name, description, icon, quantity, and category-specific fields

#### Scenario: Editing updates state
- **WHEN** user changes a field in the inspector
- **THEN** the TokensEditor SHALL dispatch UPDATE_TOKEN and the grid SHALL reflect changes

### Requirement: TokensProvider wraps the application
`App.tsx` SHALL wrap the authenticated app content with `TokensProvider` and render `TokensEditor` for the tokens screen.

#### Scenario: Provider and editor in component tree
- **WHEN** the app renders and user navigates to tokens
- **THEN** `TokensProvider` SHALL be an ancestor of `TokensEditor`
