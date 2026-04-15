## Why

The RulesEditor UI currently hardcodes all game rule values as `defaultValue` props directly in JSX. There is no state management, no domain model, and no way to actually edit, reset, or persist rules. The DDD document (`docs/domain-model.md`) defines Rules as a value object within the Design Context, but this hasn't been implemented. Starting with Rules as a pilot establishes the domain layer architecture pattern (types → context/reducer → UI binding) that will later extend to Board, Cards, and Tokens.

## What Changes

- Define a structured `Rules` domain type based on the DDD document's definition (economy, player config, mechanics, auction settings)
- Replace the existing flat `GameConfig` interface in `types.ts` with a domain-aligned `Rules` type organized by sub-domain (economy, players, mechanics, auction)
- Create a `RulesContext` using React Context + `useReducer` to manage Rules state with typed actions (update field, reset to defaults, apply changes)
- Refactor `RulesEditor` to read from and dispatch to `RulesContext` instead of using hardcoded `defaultValue` props
- Extract current mock values into a `DEFAULT_RULES` constant in the domain layer

## Capabilities

### New Capabilities
- `rules-domain-model`: Domain type definitions and default state for the Rules value object, plus React Context/reducer for state management

### Modified Capabilities

## Impact

- `src/types.ts` — `GameConfig` interface replaced by structured `Rules` type
- `src/components/RulesEditor.tsx` — refactored from static mock to context-driven
- New files: `src/domain/rules.ts` (types + defaults), `src/contexts/RulesContext.tsx` (context + reducer)
- `src/App.tsx` — wrap with `RulesProvider`
- No external dependency changes (uses React Context + useReducer)
