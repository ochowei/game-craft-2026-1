## ADDED Requirements

### Requirement: Desktop sidebar unchanged
On viewports at or above `md` (768px), the Card Inspector SHALL render as a right sidebar identical to the current implementation.

#### Scenario: Desktop renders sidebar
- **WHEN** viewport width is 768px or greater
- **THEN** Card Inspector displays as a fixed-width right sidebar alongside the card grid

### Requirement: Mobile bottom sheet peek state
On viewports below `md`, the Card Inspector SHALL render as a bottom sheet in peek state by default, showing only a drag handle and title bar (~48px).

#### Scenario: Initial mobile state
- **WHEN** viewport width is less than 768px and the page loads
- **THEN** a bottom sheet is visible at the bottom of the screen showing a handle bar and "Card Inspector" title

#### Scenario: Peek does not obscure card grid
- **WHEN** bottom sheet is in peek state
- **THEN** the card grid is scrollable and cards are fully visible above the peek bar

### Requirement: Mobile bottom sheet expanded state
Tapping the peek bar SHALL expand the bottom sheet to show the full inspector content, scrollable within the sheet.

#### Scenario: Expand from peek
- **WHEN** user taps the bottom sheet peek bar
- **THEN** the bottom sheet expands to approximately 70% of viewport height with full inspector content visible

#### Scenario: Collapse from expanded
- **WHEN** user taps the handle bar while bottom sheet is expanded
- **THEN** the bottom sheet collapses back to peek state

### Requirement: Bottom sheet inspector content
The expanded bottom sheet SHALL contain all the same content as the desktop sidebar: live preview, Content/Visuals/Logic tabs, form fields, and Save Changes button.

#### Scenario: Full content in expanded sheet
- **WHEN** bottom sheet is in expanded state
- **THEN** all inspector sections (preview, tabs, form fields, save button) are present and scrollable

### Requirement: Floating action palette hidden on mobile
The floating action palette at the bottom of the screen SHALL be hidden on viewports below `md`.

#### Scenario: Palette hidden on mobile
- **WHEN** viewport width is less than 768px
- **THEN** the floating action palette is not visible

#### Scenario: Palette visible on desktop
- **WHEN** viewport width is 768px or greater
- **THEN** the floating action palette displays as current
