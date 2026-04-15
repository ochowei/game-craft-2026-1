## ADDED Requirements

### Requirement: Responsive page padding
All content pages SHALL use `p-4` on viewports below `md` (768px) and `p-8` on viewports at or above `md`.

#### Scenario: Mobile padding
- **WHEN** viewport width is less than 768px
- **THEN** page content areas have 16px padding on all sides

#### Scenario: Desktop padding unchanged
- **WHEN** viewport width is 768px or greater
- **THEN** page content areas have 32px padding on all sides (same as current)

### Requirement: Responsive page headers
Page headers with action buttons SHALL stack vertically on mobile (title above, buttons below) and display horizontally on desktop.

#### Scenario: RulesEditor header on mobile
- **WHEN** viewport width is less than 768px on the Rules page
- **THEN** the title and description appear above the Reset/Apply buttons, stacked vertically with gap

#### Scenario: RulesEditor header on desktop
- **WHEN** viewport width is 768px or greater on the Rules page
- **THEN** the header displays title on left and buttons on right in a single row

#### Scenario: CardDesigner header on mobile
- **WHEN** viewport width is less than 768px on the Cards page
- **THEN** the title and description appear above the Chance/Community Chest tabs, stacked vertically

#### Scenario: CardDesigner header on desktop
- **WHEN** viewport width is 768px or greater on the Cards page
- **THEN** the header displays title on left and tabs on right in a single row

### Requirement: Responsive title typography
The TemplateLibrary page title SHALL use smaller font size on mobile to prevent text overflow.

#### Scenario: TemplateLibrary title on mobile
- **WHEN** viewport width is less than 768px on the Library page
- **THEN** the main title renders at `text-3xl` size (30px)

#### Scenario: TemplateLibrary title on desktop
- **WHEN** viewport width is 768px or greater on the Library page
- **THEN** the main title renders at `text-5xl` size (48px, same as current)

### Requirement: Desktop layout preservation
All changes SHALL preserve the existing desktop layout identically at viewports of 768px and above.

#### Scenario: No visual regression on desktop
- **WHEN** viewport width is 768px or greater
- **THEN** all pages render identically to their current appearance
