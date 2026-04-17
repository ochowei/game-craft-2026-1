## ADDED Requirements

### Requirement: loadState reads and parses from localStorage
The system SHALL provide a `loadState<T>(key, fallback): T` function that reads a JSON string from localStorage, parses it, and returns the result. If the key is missing, the value is invalid JSON, or localStorage is unavailable, it SHALL return the fallback value.

#### Scenario: Key exists with valid JSON
- **WHEN** localStorage contains valid JSON at the given key
- **THEN** loadState SHALL return the parsed object

#### Scenario: Key does not exist
- **WHEN** localStorage does not contain the given key
- **THEN** loadState SHALL return the fallback value

#### Scenario: Corrupted JSON
- **WHEN** localStorage contains invalid JSON at the given key
- **THEN** loadState SHALL return the fallback value without throwing

### Requirement: saveState writes JSON to localStorage
The system SHALL provide a `saveState(key, data): void` function that serializes data to JSON and writes it to localStorage. If localStorage is unavailable, it SHALL fail silently.

#### Scenario: Save succeeds
- **WHEN** saveState is called with valid data
- **THEN** the JSON string SHALL be stored at the given key in localStorage

#### Scenario: localStorage unavailable
- **WHEN** localStorage throws (e.g., private browsing, quota exceeded)
- **THEN** saveState SHALL not throw an error

### Requirement: LibraryContext persists items to localStorage
LibraryProvider SHALL initialize items from `localStorage('gamecraft:library')` falling back to `DEFAULT_LIBRARY`, and SHALL save the items array on every state change. UI state (activeFilter) SHALL NOT be persisted.

#### Scenario: Library items persist across reload
- **WHEN** user removes a library item and reloads the page
- **THEN** the updated items array SHALL be restored from localStorage
