## 1. Domain Layer

- [x] 1.1 Create `src/domain/rules.ts` with the `Rules` type (economy, players, mechanics, auction sub-objects) and `DEFAULT_RULES` constant matching current hardcoded values
- [x] 1.2 Remove the `GameConfig` interface from `src/types.ts` (confirmed unused by components)

## 2. State Management

- [x] 2.1 Create `src/contexts/RulesContext.tsx` with `RulesProvider`, `useRules` hook, and `rulesReducer` handling `UPDATE_FIELD` and `RESET` actions
- [x] 2.2 Wrap authenticated app content in `App.tsx` with `RulesProvider`

## 3. UI Binding

- [x] 3.1 Refactor `RulesEditor` to read all field values from `useRules()` context instead of hardcoded `defaultValue` props
- [x] 3.2 Wire all input fields to dispatch `UPDATE_FIELD` actions on change
- [x] 3.3 Wire toggle switches to dispatch `UPDATE_FIELD` actions on click
- [x] 3.4 Wire "Reset Defaults" button to dispatch `RESET` action

## 4. Verification

- [x] 4.1 Verify RulesEditor renders with default values from context (visual check)
- [x] 4.2 Verify editing fields updates state and UI reflects changes
- [x] 4.3 Verify Reset Defaults restores all fields to default values
