## REMOVED Requirements

### Requirement: RulesContext persists rules to localStorage
**Reason:** Rules are now persisted to Firestore under `projects/{activeProjectId}/design/rules`. Replaced by the `firestore-persistence` capability.
**Migration:** None. No production users exist; existing `gamecraft:rules` localStorage entries are abandoned. The new implementation seeds from `DEFAULT_RULES` if the Firestore document does not exist.

### Requirement: CardsContext persists cards to localStorage
**Reason:** Cards are now persisted to Firestore under `projects/{activeProjectId}/design/cards`. Replaced by the `firestore-persistence` capability.
**Migration:** None. Existing `gamecraft:cards` localStorage entries are abandoned.

### Requirement: BoardContext persists tiles to localStorage
**Reason:** Board tiles are now persisted to Firestore under `projects/{activeProjectId}/design/board`. Replaced by the `firestore-persistence` capability.
**Migration:** None. Existing `gamecraft:board` localStorage entries are abandoned.

### Requirement: TokensContext persists tokens to localStorage
**Reason:** Tokens are now persisted to Firestore under `projects/{activeProjectId}/design/tokens`. Replaced by the `firestore-persistence` capability.
**Migration:** None. Existing `gamecraft:tokens` localStorage entries are abandoned.

## RETAINED Requirements

The following requirements from the current `localstorage-persistence` spec remain in force and are **not changed** by this proposal:

- **loadState reads and parses from localStorage** — retained, still used by Library.
- **saveState writes JSON to localStorage** — retained, still used by Library.
- **LibraryContext persists items to localStorage** — retained. Library is a cross-project concern and remains on localStorage in Phase 1. Migrating Library to Firestore is explicitly out of scope and may be addressed in a follow-up change.
