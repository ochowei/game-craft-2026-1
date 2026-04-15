## Context

TemplateLibrary currently renders 5 hardcoded official templates as a community gallery with external images, author names, download/like counts, difficulty badges, and filter bars. None of this aligns with the DDD definition: Library is a personal collection of reusable components owned by the user. The Library Context in the DDD doc is a separate bounded context from Design, with its own aggregate root. Library items are copies — instantiating a Library item into a Project creates a copy, not a reference.

The three core domain models (Rules, Cards, Board) are now implemented. Library needs to reference their types so users can save card templates, tile presets, etc.

## Goals / Non-Goals

**Goals:**
- Define `LibraryItem` as a discriminated union supporting multiple component types
- Start with three item types: card-template, tile-preset, color-palette
- Create Library UI showing saved items in a grid, filterable by type tabs
- Support adding and removing items from the library
- Include seed data so the UI isn't empty
- Establish the pattern for "Save to Library" (domain + context ready, editor wiring is future)

**Non-Goals:**
- "Save to Library" buttons in BoardEditor/CardDesigner (future work — needs UI design for the save flow)
- Library item editing (items are snapshots; edit the source and re-save)
- Cross-project Library sharing or syncing
- Community marketplace, official templates, downloads/likes
- Persistence (same as other domain models — future Firestore work)
- Token templates (Tokens editor doesn't exist yet)

## Decisions

### 1. LibraryItem as discriminated union vs generic metadata bag

**Decision:** `LibraryItem` uses a `itemType` discriminator with type-specific `data` payloads. Card templates store partial Card data, tile presets store partial Tile data, color palettes store an array of ColorGroup entries.

**Rationale:** Different item types have fundamentally different data shapes. A discriminated union makes the type system enforce correct data for each variant. The Library UI can render type-specific previews.

**Alternative considered:** Generic `metadata: Record<string, unknown>`. Rejected for lack of type safety.

### 2. Library items as copies, not references

**Decision:** Library items store a snapshot of the data at save time. Instantiating into a project creates a new copy.

**Rationale:** DDD document explicitly states: "A Library item can be instantiated into any Project without creating a dependency (copy, not reference)." This keeps Library decoupled from the Design context.

### 3. UI layout: tabs + grid vs single list

**Decision:** Type filter tabs (All, Card Templates, Tile Presets, Color Palettes) above a card grid. Similar to CardDesigner's deck tab pattern.

**Rationale:** Consistent with existing UI patterns. Tabs allow quick filtering when the library grows. Grid layout shows visual previews.

### 4. Component rename: TemplateLibrary → Library

**Decision:** Rename the component and file to `Library.tsx`.

**Rationale:** "Template" implies official pre-made content. The DDD concept is simply "Library." The nav item in Layout already says "Library."

## Risks / Trade-offs

- **Losing the template gallery UI** → The existing gallery was mock-only with no functionality. The new Library provides real utility. If official templates are wanted later, they can be a separate feature.
- **Seed data feels artificial** → Users will eventually save their own items. Seeds demonstrate the UI and can be deleted. Clearly labeled as examples.
- **No "Save to Library" flow yet** → The domain model and context are ready. The save flow from editors requires UX decisions about what to save and how — better as a separate change.
