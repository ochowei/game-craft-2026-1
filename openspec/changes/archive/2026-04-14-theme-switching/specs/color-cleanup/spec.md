## MODIFIED Requirements

### Requirement: All components use semantic color tokens
All component files SHALL use semantic CSS token classes (e.g., `bg-surface-container`, `text-on-surface-variant`, `text-primary`) instead of hardcoded Tailwind color classes (e.g., `bg-slate-900`, `text-blue-400`).

#### Scenario: No hardcoded slate colors remain
- **WHEN** searching all component files for `slate-` color classes
- **THEN** zero matches are found

#### Scenario: No hardcoded blue numeric colors remain
- **WHEN** searching all component files for `blue-[0-9]` color classes
- **THEN** zero matches are found

### Requirement: Semantic token mapping is consistent
Components SHALL use the following mapping from hardcoded colors to semantic tokens:

#### Scenario: Surface colors
- **WHEN** a component needs a dark background
- **THEN** it uses `bg-surface-container` (not `bg-slate-900`) or `bg-surface-container-high` (not `bg-slate-800`)

#### Scenario: Text colors
- **WHEN** a component needs secondary/muted text
- **THEN** it uses `text-on-surface-variant` (not `text-slate-400` or `text-slate-500`)

#### Scenario: Primary accent colors
- **WHEN** a component needs a primary accent
- **THEN** it uses `text-primary` or `bg-primary` (not `text-blue-400` or `bg-blue-600`)

#### Scenario: Border colors
- **WHEN** a component needs a subtle border
- **THEN** it uses `border-outline-variant` (not `border-slate-800`)

### Requirement: Components affected
The following files SHALL be updated: `Layout.tsx` (~21 replacements), `BoardEditor.tsx` (~26), `CardDesigner.tsx` (~28), `LoginScreen.tsx` (~2), `App.tsx` (~1).

#### Scenario: All listed components are migrated
- **WHEN** the color cleanup is complete
- **THEN** each listed file uses only semantic tokens for colors
