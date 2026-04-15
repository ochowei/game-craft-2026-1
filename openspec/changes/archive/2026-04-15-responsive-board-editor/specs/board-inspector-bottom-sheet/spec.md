## ADDED Requirements

### Requirement: Desktop sidebar unchanged
On viewports at or above `md` (768px), the Board Inspector SHALL render as a right sidebar identical to the current implementation.

#### Scenario: Desktop renders sidebar
- **WHEN** viewport width is 768px or greater
- **THEN** Board Inspector displays as a fixed-width right sidebar alongside the canvas

### Requirement: Mobile bottom sheet peek state
On viewports below `md`, the Board Inspector SHALL render as a bottom sheet in peek state by default, showing only a handle bar and title (~48px).

#### Scenario: Initial mobile state
- **WHEN** viewport width is less than 768px and the page loads
- **THEN** a bottom sheet is visible at the bottom showing a handle bar and "Inspector" title

### Requirement: Mobile bottom sheet expanded state
Tapping the peek bar SHALL expand the bottom sheet to show the full inspector content.

#### Scenario: Expand from peek
- **WHEN** user taps the bottom sheet peek bar
- **THEN** the bottom sheet expands to approximately 70% of viewport height with full inspector content

#### Scenario: Collapse from expanded
- **WHEN** user taps the handle bar while expanded
- **THEN** the bottom sheet collapses back to peek state

### Requirement: Bottom sheet inspector content
The expanded bottom sheet SHALL contain all the same content as the desktop sidebar: selected tile info, form fields, rent structure, color group, and delete button.

#### Scenario: Full content in expanded sheet
- **WHEN** bottom sheet is in expanded state
- **THEN** all inspector sections are present and scrollable
