## 1. Domain Layer

- [x] 1.1 Create `src/domain/tokens.ts` with `Token`, `TokenCategory` types and `DEFAULT_TOKENS` seed data (~15 items covering all categories)

## 2. State Management

- [x] 2.1 Create `src/contexts/TokensContext.tsx` with `TokensProvider`, `useTokens` hook, and reducer handling `SELECT_TOKEN`, `UPDATE_TOKEN`, `SET_CATEGORY`, `ADD_TOKEN`, `DELETE_TOKEN`
- [x] 2.2 Update `App.tsx`: wrap with `TokensProvider`, replace placeholder with TokensEditor import

## 3. UI Implementation

- [x] 3.1 Create `src/components/TokensEditor.tsx` with category filter tabs, token grid with icon previews
- [x] 3.2 Add inspector sidebar (desktop) / bottom sheet (mobile) with editable fields for selected token
- [x] 3.3 Wire all interactions: tab switching, token selection, field editing, add new token, delete token

## 4. Verification

- [x] 4.1 TypeScript compiles clean, production build succeeds
- [x] 4.2 Verify token grid renders seed data, category tabs filter correctly, inspector edits work
