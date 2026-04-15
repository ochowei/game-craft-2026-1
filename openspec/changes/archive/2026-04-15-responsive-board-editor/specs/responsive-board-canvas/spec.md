## ADDED Requirements

### Requirement: Responsive board canvas sizing
The board canvas SHALL scale responsively to fit the available width on mobile while maintaining a square aspect ratio, up to a maximum of 600px.

#### Scenario: Mobile canvas fits viewport
- **WHEN** viewport width is less than 768px
- **THEN** the board canvas fills the available width (minus padding) and maintains square aspect ratio

#### Scenario: Desktop canvas unchanged
- **WHEN** viewport width is 768px or greater
- **THEN** the board canvas displays at 600×600px as current

### Requirement: Canvas zoom controls positioning
Canvas zoom controls SHALL be positioned to avoid overlap with the bottom sheet on mobile.

#### Scenario: Mobile zoom controls position
- **WHEN** viewport width is less than 768px
- **THEN** zoom controls are positioned at bottom-left, above the bottom sheet peek bar

#### Scenario: Desktop zoom controls unchanged
- **WHEN** viewport width is 768px or greater
- **THEN** zoom controls are centered at the bottom of the canvas area as current

### Requirement: Autosave indicator positioning
The autosave status indicator SHALL be visible on mobile without being obscured by the bottom sheet or positioned off-screen.

#### Scenario: Mobile autosave position
- **WHEN** viewport width is less than 768px
- **THEN** autosave indicator is visible near the bottom-right of the screen, above the bottom sheet peek bar

#### Scenario: Desktop autosave unchanged
- **WHEN** viewport width is 768px or greater
- **THEN** autosave indicator displays at its current position (bottom-right, offset for sidebar)
