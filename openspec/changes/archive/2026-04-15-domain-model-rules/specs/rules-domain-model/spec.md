## ADDED Requirements

### Requirement: Rules domain type defines game rule structure
The system SHALL define a `Rules` type organized into four sub-objects: `economy`, `players`, `mechanics`, and `auction`, matching the DDD document's definition of the Rules value object.

#### Scenario: Economy sub-object
- **WHEN** a Rules object is created
- **THEN** it SHALL contain an `economy` object with `startingCash` (number) and `salary` (number) fields

#### Scenario: Players sub-object
- **WHEN** a Rules object is created
- **THEN** it SHALL contain a `players` object with `minPlayers` (number), `maxPlayers` (number), `allowAI` (boolean), and `spectatorMode` (boolean) fields

#### Scenario: Mechanics sub-object
- **WHEN** a Rules object is created
- **THEN** it SHALL contain a `mechanics` object with `doubleRentOnSets` (boolean), `mandatoryAuctions` (boolean), and `instantBankruptcy` (boolean) fields

#### Scenario: Auction sub-object
- **WHEN** a Rules object is created
- **THEN** it SHALL contain an `auction` object with `startingBid` (number), `bidIncrement` (string enum), and `timerDuration` (string enum) fields

### Requirement: Default rules match current hardcoded values
The system SHALL provide a `DEFAULT_RULES` constant that matches the values currently hardcoded in RulesEditor.

#### Scenario: Default economy values
- **WHEN** DEFAULT_RULES is used
- **THEN** `economy.startingCash` SHALL be 1500 and `economy.salary` SHALL be 200

#### Scenario: Default player values
- **WHEN** DEFAULT_RULES is used
- **THEN** `players.minPlayers` SHALL be 2, `players.maxPlayers` SHALL be 8, `players.allowAI` SHALL be true, and `players.spectatorMode` SHALL be false

#### Scenario: Default mechanics values
- **WHEN** DEFAULT_RULES is used
- **THEN** `mechanics.doubleRentOnSets` SHALL be true, `mechanics.mandatoryAuctions` SHALL be true, and `mechanics.instantBankruptcy` SHALL be false

#### Scenario: Default auction values
- **WHEN** DEFAULT_RULES is used
- **THEN** `auction.startingBid` SHALL be 10, `auction.bidIncrement` SHALL be "$10 Scaled", and `auction.timerDuration` SHALL be "30 Seconds"

### Requirement: RulesContext provides state and dispatch
The system SHALL provide a `RulesContext` using React Context + useReducer that exposes the current `Rules` state and a `dispatch` function to all descendants.

#### Scenario: Context provides current rules
- **WHEN** a component calls `useRules()`
- **THEN** it SHALL receive the current `Rules` state object

#### Scenario: Context provides dispatch
- **WHEN** a component calls `useRules()`
- **THEN** it SHALL receive a `dispatch` function for sending actions to the reducer

#### Scenario: Context initializes with defaults
- **WHEN** `RulesProvider` mounts without saved state
- **THEN** the initial state SHALL equal `DEFAULT_RULES`

### Requirement: Rules reducer handles UPDATE_FIELD action
The reducer SHALL handle an `UPDATE_FIELD` action that updates a single field within the Rules state.

#### Scenario: Update a top-level section field
- **WHEN** dispatch receives `{ type: 'UPDATE_FIELD', section: 'economy', field: 'startingCash', value: 2000 }`
- **THEN** `rules.economy.startingCash` SHALL become 2000 and all other fields SHALL remain unchanged

#### Scenario: Update a boolean field
- **WHEN** dispatch receives `{ type: 'UPDATE_FIELD', section: 'mechanics', field: 'instantBankruptcy', value: true }`
- **THEN** `rules.mechanics.instantBankruptcy` SHALL become true

### Requirement: Rules reducer handles RESET action
The reducer SHALL handle a `RESET` action that restores the entire state to `DEFAULT_RULES`.

#### Scenario: Reset after edits
- **WHEN** a user has modified several fields and dispatch receives `{ type: 'RESET' }`
- **THEN** the Rules state SHALL equal `DEFAULT_RULES`

### Requirement: RulesEditor reads from context
RulesEditor SHALL read all field values from `useRules()` instead of using hardcoded `defaultValue` props.

#### Scenario: Editor displays context values
- **WHEN** RulesEditor renders
- **THEN** all input fields SHALL display the current values from `RulesContext`

#### Scenario: Editor reflects external state changes
- **WHEN** the Rules state is updated by another action (e.g., RESET)
- **THEN** RulesEditor input fields SHALL reflect the new values

### Requirement: RulesEditor dispatches on input change
RulesEditor SHALL dispatch `UPDATE_FIELD` actions when the user edits any input field.

#### Scenario: User changes starting cash
- **WHEN** the user changes the Starting Cash input to 2000
- **THEN** RulesEditor SHALL dispatch `{ type: 'UPDATE_FIELD', section: 'economy', field: 'startingCash', value: 2000 }`

#### Scenario: User toggles a mechanic
- **WHEN** the user toggles the "Instant Bankruptcy" switch
- **THEN** RulesEditor SHALL dispatch `{ type: 'UPDATE_FIELD', section: 'mechanics', field: 'instantBankruptcy', value: <toggled> }`

### Requirement: Reset Defaults button restores default state
The "Reset Defaults" button in RulesEditor SHALL dispatch a `RESET` action.

#### Scenario: User clicks Reset Defaults
- **WHEN** the user clicks the "Reset Defaults" button
- **THEN** all fields SHALL revert to `DEFAULT_RULES` values

### Requirement: RulesProvider wraps the application
`App.tsx` SHALL wrap the authenticated app content with `RulesProvider` so that RulesEditor and any future consumers can access Rules state.

#### Scenario: Provider in component tree
- **WHEN** the app renders for an authenticated user
- **THEN** `RulesProvider` SHALL be an ancestor of `RulesEditor` in the component tree
