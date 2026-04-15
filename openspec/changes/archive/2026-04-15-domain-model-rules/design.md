## Context

RulesEditor currently renders hardcoded `defaultValue` props in JSX with no backing state. The existing `GameConfig` interface in `types.ts` is flat and unused by any context or reducer. The DDD document (`docs/domain-model.md`) defines Rules as a value object within the Design Context's Project aggregate, covering economy, player configuration, win/loss conditions, and auction mechanics. This change introduces the domain layer pattern that will be reused for Board, Cards, and Tokens.

## Goals / Non-Goals

**Goals:**
- Establish a `src/domain/` directory as the home for domain types and defaults
- Define a structured `Rules` type organized by sub-domain (economy, players, mechanics, auction)
- Implement `RulesContext` with `useReducer` for state management with typed actions
- Make RulesEditor fully interactive: editing fields updates state, Reset restores defaults, Apply is wired up
- Create a reusable pattern (domain type → context/reducer → UI binding) for future aggregates

**Non-Goals:**
- Persistence to Firestore or localStorage (future work)
- Undo/Redo (belongs to History context per DDD doc)
- Validation beyond basic type safety (e.g., minPlayers <= maxPlayers — deferred)
- Domain model for Board, Cards, or Tokens (future changes using same pattern)
- Win/loss conditions (defined in DDD doc but no UI exists yet)

## Decisions

### 1. Structured type with sub-objects vs flat interface

**Decision:** Replace `GameConfig` with a `Rules` type organized into `economy`, `players`, `mechanics`, and `auction` sub-objects.

**Rationale:** The DDD document groups rules by sub-domain. A structured type makes it clear which fields belong together and mirrors the UI sections (Economy card, Player Limits card, etc.). The existing flat `GameConfig` doesn't reflect these groupings.

**Alternative considered:** Keep flat interface, just add state management. Rejected because it doesn't align with the DDD model and makes the pattern harder to extend.

### 2. React Context + useReducer vs Zustand

**Decision:** Use React Context + `useReducer`.

**Rationale:** The project already uses this pattern for `AuthContext`. Rules state is small and only consumed by `RulesEditor`, so Context re-render concerns don't apply. Adding Zustand would introduce a new dependency for no practical benefit at this scale.

### 3. Domain files location: `src/domain/` vs co-located with context

**Decision:** Create `src/domain/rules.ts` for types and defaults, separate from `src/contexts/RulesContext.tsx`.

**Rationale:** Domain types should be importable without pulling in React. This separation allows future non-React consumers (e.g., export logic, validation utilities) to import domain types cleanly. Follows the layered architecture from the explore session.

### 4. Action granularity: field-level vs section-level vs replace-all

**Decision:** Field-level updates via a single `UPDATE_FIELD` action using a path-based approach, plus `RESET` for restoring defaults.

**Rationale:** Each form input maps to one field. A single generic update action keeps the reducer simple. Section-level would require callers to spread existing values. Replace-all is too coarse for individual edits.

## Risks / Trade-offs

- **`GameConfig` removal is breaking for any code importing it** → The only current import is in `types.ts` itself (it's defined but unused by components). Search confirms no other files import `GameConfig`. Low risk.
- **No persistence means state resets on page reload** → Acceptable for this pilot. Persistence is explicitly a non-goal; it will come when we connect Firestore.
- **`UPDATE_FIELD` with string paths loses some type safety** → Mitigated by typing the action payload with mapped types. The reducer can validate at runtime. Full type-safe field paths in TypeScript are complex; we'll start pragmatic and tighten if needed.
