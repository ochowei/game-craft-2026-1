## ADDED Requirements

### Requirement: Avatar always visible
Avatar SHALL be visible on all screen sizes without being clipped or shrunk by flex layout.

#### Scenario: Mobile viewport
- **WHEN** viewport width is less than 768px
- **THEN** avatar image is visible in the top nav bar with its full 32x32px size

#### Scenario: Desktop viewport
- **WHEN** viewport width is 768px or greater
- **THEN** avatar displays in its current position alongside user name and logout button

### Requirement: Hamburger menu button on mobile
A hamburger menu button SHALL be displayed in the top nav when viewport is below the `md` breakpoint (768px).

#### Scenario: Mobile shows hamburger
- **WHEN** viewport width is less than 768px
- **THEN** a hamburger button (material icon `menu`) is visible in the top nav

#### Scenario: Desktop hides hamburger
- **WHEN** viewport width is 768px or greater
- **THEN** the hamburger button is not rendered

### Requirement: Hamburger dropdown contains hidden actions
When the hamburger menu is open, it SHALL display all actions that are hidden on mobile: save, cloud upload, settings, Export, Playtest, and Logout.

#### Scenario: Open menu shows all actions
- **WHEN** user taps the hamburger button
- **THEN** a dropdown panel appears below the nav bar containing: save, cloud upload, settings, Export, Playtest, and Logout buttons

#### Scenario: Close menu on action tap
- **WHEN** user taps any action inside the dropdown
- **THEN** the dropdown closes

#### Scenario: Close menu on outside tap
- **WHEN** user taps outside the dropdown panel
- **THEN** the dropdown closes

### Requirement: Mobile nav shows only essential elements
On mobile (below `md` breakpoint), the top nav SHALL only show: logo, avatar, and hamburger menu button. All other elements (save, cloud, settings, Export, user name, logout, Playtest) SHALL be hidden.

#### Scenario: Mobile nav content
- **WHEN** viewport width is less than 768px
- **THEN** only logo text, avatar image, and hamburger button are visible in the top nav bar

### Requirement: Desktop layout unchanged
The top nav layout at `md` breakpoint and above SHALL remain identical to the current implementation.

#### Scenario: Desktop nav unchanged
- **WHEN** viewport width is 768px or greater
- **THEN** all existing nav elements (logo, Project/Assets/History, save/cloud/settings, Export, user name, logout, avatar, Playtest) display as they do currently
