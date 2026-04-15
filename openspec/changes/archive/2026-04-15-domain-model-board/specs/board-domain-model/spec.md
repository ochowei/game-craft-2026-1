## ADDED Requirements

### Requirement: Tile domain type defines tile structure
The system SHALL define a `Tile` type with fields: `position` (number 0-39), `name` (string), `tileType` (TileType), and optional fields `colorGroup` (ColorGroup), `price` (number), `mortgage` (number), `rent` (RentStructure), and `effect` (TileEffect).

#### Scenario: Property tile has all fields
- **WHEN** a Tile with tileType `'property'` is created
- **THEN** it SHALL have `name`, `position`, `tileType`, `colorGroup`, `price`, `mortgage`, and `rent` populated

#### Scenario: Special tile has minimal fields
- **WHEN** a Tile with tileType `'go'` or `'jail'` is created
- **THEN** it SHALL have `name`, `position`, and `tileType`, with optional fields omitted

### Requirement: TileType covers all board tile categories
The system SHALL define `TileType` as a union of: `'property'`, `'railroad'`, `'utility'`, `'tax'`, `'chance'`, `'community-chest'`, `'go'`, `'jail'`, `'free-parking'`, `'go-to-jail'`.

#### Scenario: All tile types representable
- **WHEN** tiles are created for a standard Monopoly board
- **THEN** every tile SHALL have a valid TileType from the defined union

### Requirement: ColorGroup defines property color categories
The system SHALL define `ColorGroup` as a union of: `'brown'`, `'light-blue'`, `'pink'`, `'orange'`, `'red'`, `'yellow'`, `'green'`, `'dark-blue'`.

#### Scenario: Property tiles have color groups
- **WHEN** a property tile is created
- **THEN** its `colorGroup` SHALL be one of the eight defined colors

### Requirement: RentStructure defines rent at each house level
The system SHALL define `RentStructure` with fields: `base` (number), `oneHouse` (number), `twoHouses` (number), `threeHouses` (number), `fourHouses` (number), `hotel` (number).

#### Scenario: Rent structure for Ventnor Avenue
- **WHEN** the Ventnor Avenue tile's rent is accessed
- **THEN** `base` SHALL be 22 and `hotel` SHALL be 1150

### Requirement: TileEffect references Cards domain
The system SHALL define `TileEffect` as a discriminated union including `{ type: 'drawCard'; deckType: CardType }` where `CardType` is imported from the Cards domain.

#### Scenario: Chance tile effect
- **WHEN** a Chance tile's effect is accessed
- **THEN** it SHALL be `{ type: 'drawCard', deckType: 'chance' }`

#### Scenario: Tax tile effect
- **WHEN** an Income Tax tile's effect is accessed
- **THEN** it SHALL be `{ type: 'payTax', amount: 200 }`

### Requirement: DEFAULT_BOARD contains 40 tiles in standard layout
The system SHALL provide a `DEFAULT_BOARD` constant containing 40 tiles at positions 0-39 following the standard Monopoly clockwise layout starting from GO.

#### Scenario: Board has correct tile count
- **WHEN** DEFAULT_BOARD is used
- **THEN** it SHALL contain exactly 40 tiles with positions 0 through 39

#### Scenario: Corner tiles at correct positions
- **WHEN** DEFAULT_BOARD is used
- **THEN** position 0 SHALL be GO, position 10 SHALL be Jail, position 20 SHALL be Free Parking, position 30 SHALL be Go To Jail

#### Scenario: Ventnor Avenue at correct position
- **WHEN** DEFAULT_BOARD is used
- **THEN** position 31 SHALL be Ventnor Avenue with tileType `'property'`, colorGroup `'yellow'`, and price 260

### Requirement: BoardContext provides state and dispatch
The system SHALL provide a `BoardContext` using React Context + useReducer that exposes board state and a dispatch function.

#### Scenario: Context provides board state
- **WHEN** a component calls `useBoard()`
- **THEN** it SHALL receive `tiles` (Tile array) and `selectedTileId` (number | null)

#### Scenario: Context provides dispatch
- **WHEN** a component calls `useBoard()`
- **THEN** it SHALL receive a `dispatch` function for sending actions to the reducer

#### Scenario: Context initializes with defaults
- **WHEN** `BoardProvider` mounts
- **THEN** tiles SHALL equal `DEFAULT_BOARD` and selectedTileId SHALL be null

### Requirement: Board reducer handles SELECT_TILE action
The reducer SHALL handle a `SELECT_TILE` action that sets the currently selected tile.

#### Scenario: Select a tile
- **WHEN** dispatch receives `{ type: 'SELECT_TILE', position: 31 }`
- **THEN** `selectedTileId` SHALL become 31

### Requirement: Board reducer handles UPDATE_TILE action
The reducer SHALL handle an `UPDATE_TILE` action that updates a field on a tile by position.

#### Scenario: Update tile name
- **WHEN** dispatch receives `{ type: 'UPDATE_TILE', position: 31, field: 'name', value: 'New Name' }`
- **THEN** the tile at position 31 SHALL have name `'New Name'` and all other tiles SHALL remain unchanged

#### Scenario: Update tile price
- **WHEN** dispatch receives `{ type: 'UPDATE_TILE', position: 31, field: 'price', value: 300 }`
- **THEN** the tile at position 31 SHALL have price 300

### Requirement: Board reducer handles UPDATE_RENT action
The reducer SHALL handle an `UPDATE_RENT` action that updates a single rent field on a tile.

#### Scenario: Update base rent
- **WHEN** dispatch receives `{ type: 'UPDATE_RENT', position: 31, field: 'base', value: 30 }`
- **THEN** the tile at position 31 SHALL have `rent.base` equal to 30 and all other rent fields unchanged

### Requirement: BoardEditor reads from context
BoardEditor SHALL read all tile data and selected tile from `useBoard()` instead of hardcoded data.

#### Scenario: Grid renders tiles from context
- **WHEN** BoardEditor renders
- **THEN** the board grid SHALL display tiles from `BoardContext` at their correct grid positions

#### Scenario: Inspector displays selected tile
- **WHEN** a tile is selected
- **THEN** the inspector SHALL display the selected tile's name, price, mortgage, rent structure, and color group from context

### Requirement: BoardEditor dispatches on user interaction
BoardEditor SHALL dispatch actions when the user interacts with tiles.

#### Scenario: User clicks a tile
- **WHEN** the user clicks a tile on the board grid
- **THEN** BoardEditor SHALL dispatch `SELECT_TILE` with that tile's position

#### Scenario: User edits tile name in inspector
- **WHEN** the user changes the Display Name input
- **THEN** BoardEditor SHALL dispatch `UPDATE_TILE` with the tile's position, field 'name', and new value

#### Scenario: User edits rent value
- **WHEN** the user changes a rent field in the inspector
- **THEN** BoardEditor SHALL dispatch `UPDATE_RENT` with the tile's position, rent field name, and new value

### Requirement: BoardProvider wraps the application
`App.tsx` SHALL wrap the authenticated app content with `BoardProvider`.

#### Scenario: Provider in component tree
- **WHEN** the app renders for an authenticated user
- **THEN** `BoardProvider` SHALL be an ancestor of `BoardEditor` in the component tree
