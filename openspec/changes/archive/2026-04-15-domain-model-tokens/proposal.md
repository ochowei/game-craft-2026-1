## Why

The Tokens editor is the last core editor with no implementation — currently just a "Tokens Editor Coming Soon" placeholder in `App.tsx`. The DDD document defines Tokens as "all game objects that are neither board tiles nor cards," covering player pieces, currency, dice, and score markers. With Rules, Cards, Board, and Library all having domain models and working UIs, Tokens is the final gap in the Design Context. Building it completes the full set of domain aggregates defined in the DDD document.

## What Changes

- Define domain types for `Token` and `TokenCategory` in `src/domain/tokens.ts` covering pawns, currency, dice, and markers
- Create `DEFAULT_TOKENS` seed data with representative examples for a Monopoly-style game
- Create `TokensContext` using React Context + useReducer with actions for: selecting a token, updating fields, adding/removing tokens, filtering by category
- Build a new `TokensEditor` component with: category filter tabs, token grid with icon previews, inspector sidebar for editing selected token, add/delete functionality
- Replace the placeholder in `App.tsx` with the new editor
- Wrap with `TokensProvider`

## Capabilities

### New Capabilities
- `tokens-domain-model`: Domain type definitions, default state, React Context/reducer, and editor UI for the Tokens aggregate

### Modified Capabilities

## Impact

- `src/domain/tokens.ts` — new file with `Token`, `TokenCategory` types and `DEFAULT_TOKENS`
- `src/contexts/TokensContext.tsx` — new file with `TokensProvider`, `useTokens` hook, and reducer
- `src/components/TokensEditor.tsx` — new file replacing the placeholder
- `src/App.tsx` — replace placeholder with TokensEditor, wrap with `TokensProvider`
- No external dependency changes
