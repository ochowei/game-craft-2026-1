## ADDED Requirements

### Requirement: Light theme CSS tokens exist
The application SHALL define a `.light` CSS selector that overrides all semantic color tokens with light-mode values.

#### Scenario: Light class activates light palette
- **WHEN** the `<html>` element has class `light`
- **THEN** all `--color-*` custom properties resolve to their light-mode values (light surfaces, dark text, adjusted accents)

#### Scenario: Dark theme is the default
- **WHEN** the `<html>` element does not have class `light`
- **THEN** the `@theme` block's dark-mode tokens apply as defaults

### Requirement: Light palette maintains brand consistency
The light-mode token values SHALL use the same hue families as the dark theme, with lightness and saturation adjusted for light backgrounds.

#### Scenario: Primary color hue consistency
- **WHEN** the light theme is active
- **THEN** the primary color is a recognizable blue from the same hue family as the dark theme's primary

### Requirement: No hardcoded colors on body
The `<body>` element in `index.html` SHALL NOT have hardcoded color classes. Base colors are applied via `@layer base` in CSS.

#### Scenario: Body element styling
- **WHEN** `index.html` renders
- **THEN** the `<body>` tag has no inline color classes (e.g., no `bg-[#121416]` or `text-[#e2e2e5]`)
