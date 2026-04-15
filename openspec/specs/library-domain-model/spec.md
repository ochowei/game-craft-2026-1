## ADDED Requirements

### Requirement: LibraryItemType defines component categories
The system SHALL define `LibraryItemType` as `'card-template' | 'tile-preset' | 'color-palette'`.

#### Scenario: Valid item types
- **WHEN** a LibraryItem is created
- **THEN** its `itemType` SHALL be one of the three defined types

### Requirement: LibraryItem defines a reusable component
The system SHALL define `LibraryItem` with fields: `id` (string), `name` (string), `itemType` (LibraryItemType), `description` (string), `createdAt` (string ISO date), and type-specific `data` payload.

#### Scenario: Card template item
- **WHEN** a LibraryItem has itemType `'card-template'`
- **THEN** its `data` SHALL contain card fields: `title`, `description`, `icon`, `accentColor`

#### Scenario: Tile preset item
- **WHEN** a LibraryItem has itemType `'tile-preset'`
- **THEN** its `data` SHALL contain tile fields: `tileType`, `colorGroup` (optional), `price` (optional), `rent` (optional RentStructure)

#### Scenario: Color palette item
- **WHEN** a LibraryItem has itemType `'color-palette'`
- **THEN** its `data` SHALL contain a `colors` array of hex color strings

### Requirement: Default library contains seed items
The system SHALL provide a `DEFAULT_LIBRARY` constant with example items demonstrating each item type.

#### Scenario: Seed items present
- **WHEN** DEFAULT_LIBRARY is used
- **THEN** it SHALL contain at least one item of each type (card-template, tile-preset, color-palette)

### Requirement: LibraryContext provides state and dispatch
The system SHALL provide a `LibraryContext` using React Context + useReducer that exposes library state and a dispatch function.

#### Scenario: Context provides library state
- **WHEN** a component calls `useLibrary()`
- **THEN** it SHALL receive `items` (LibraryItem array) and `activeFilter` (LibraryItemType | 'all')

#### Scenario: Context initializes with defaults
- **WHEN** `LibraryProvider` mounts
- **THEN** items SHALL equal `DEFAULT_LIBRARY` and activeFilter SHALL be `'all'`

### Requirement: Library reducer handles ADD_ITEM action
The reducer SHALL handle an `ADD_ITEM` action that adds a new item to the library.

#### Scenario: Add a card template
- **WHEN** dispatch receives `{ type: 'ADD_ITEM', item: <LibraryItem> }`
- **THEN** the item SHALL be added to the items array

### Requirement: Library reducer handles REMOVE_ITEM action
The reducer SHALL handle a `REMOVE_ITEM` action that removes an item by id.

#### Scenario: Remove an item
- **WHEN** dispatch receives `{ type: 'REMOVE_ITEM', itemId: 'some-id' }`
- **THEN** the item with that id SHALL be removed from the items array

### Requirement: Library reducer handles SET_FILTER action
The reducer SHALL handle a `SET_FILTER` action that changes the active type filter.

#### Scenario: Filter by card templates
- **WHEN** dispatch receives `{ type: 'SET_FILTER', filter: 'card-template' }`
- **THEN** `activeFilter` SHALL become `'card-template'`

#### Scenario: Show all items
- **WHEN** dispatch receives `{ type: 'SET_FILTER', filter: 'all' }`
- **THEN** `activeFilter` SHALL become `'all'`

### Requirement: Library component displays items filtered by type
The Library component SHALL display library items from context, filtered by the active filter.

#### Scenario: All filter shows everything
- **WHEN** activeFilter is `'all'`
- **THEN** all library items SHALL be displayed

#### Scenario: Type filter shows only matching items
- **WHEN** activeFilter is `'card-template'`
- **THEN** only items with itemType `'card-template'` SHALL be displayed

### Requirement: Library component has type filter tabs
The Library component SHALL display filter tabs: All, Card Templates, Tile Presets, Color Palettes.

#### Scenario: User switches filter
- **WHEN** user clicks the "Tile Presets" tab
- **THEN** the Library SHALL dispatch `SET_FILTER` with `'tile-preset'` and the grid SHALL update

### Requirement: Library items show type-specific previews
Each library item card SHALL render a visual preview appropriate to its type.

#### Scenario: Card template preview
- **WHEN** a card-template item is displayed
- **THEN** it SHALL show the card icon and title in a mini card preview

#### Scenario: Tile preset preview
- **WHEN** a tile-preset item is displayed
- **THEN** it SHALL show the color group color and tile type label

#### Scenario: Color palette preview
- **WHEN** a color-palette item is displayed
- **THEN** it SHALL show the palette colors as a row of swatches

### Requirement: Library items can be removed
Each library item card SHALL have a delete action that dispatches `REMOVE_ITEM`.

#### Scenario: User deletes an item
- **WHEN** user clicks the delete button on a library item
- **THEN** the Library SHALL dispatch `REMOVE_ITEM` with that item's id

### Requirement: LibraryProvider wraps the application
`App.tsx` SHALL wrap the authenticated app content with `LibraryProvider`.

#### Scenario: Provider in component tree
- **WHEN** the app renders for an authenticated user
- **THEN** `LibraryProvider` SHALL be an ancestor of `Library` in the component tree
