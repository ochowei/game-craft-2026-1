# GameCraft Domain Model

Domain-Driven Design (DDD) document for GameCraft, a web-based board game design tool.

Established: 2026-04-15

---

## Ubiquitous Language (Glossary)

### Project

A board game design workspace. Acts as the top-level container for all design elements: Board, Cards, Rules, and Tokens. A single Project can export multiple Games (e.g., different versions or editions).

> Status: concept reserved, not yet implemented as a standalone feature.

### Game

A finished, publishable artifact exported from a Project. Represents a playable board game. One Project can produce many Games.

> Status: not yet implemented.

### Board

The game board. Encompasses:

- **Layout** — the arrangement and positioning of tiles/spaces.
- **Visual appearance** — colors, images, styling of each tile.
- **Tile effects** — the rules/effects attached to individual tiles (e.g., pay rent, draw a card, go to jail).

Board tiles may trigger Card draws, but Cards are designed independently from the Board.

> Status: BoardEditor exists.

### Cards

Independent decks of cards, designed separately from the Board. Each card has its own content, visuals, and gameplay effect. Board tiles reference Cards through a "draw" action — the Card definitions live in their own deck, not on the Board.

Card properties: title, description, type (e.g., Chance, Community Chest), icon, accent color.

> Status: CardDesigner exists.

### Rules

Global game mechanics and settings that apply to the entire game. Includes:

- Economy (starting cash, salary, rent multipliers)
- Player configuration (min/max players, AI players, spectator mode)
- Win/loss conditions
- Auction mechanics (starting bid, increment, timer)
- Standard mechanics (mandatory auctions, instant bankruptcy)

Rules do NOT include tile-specific effects (those belong to Board) or card-specific effects (those belong to Cards).

> Status: RulesEditor exists.

### Tokens

All game objects that are neither board tiles nor cards. Broad category that includes:

- Player pieces (pawns, figurines)
- Currency (bills, coins)
- Dice
- Score markers / trackers
- Any other physical game components

Each Token's associated assets (images, icons) are managed directly within the Tokens editor.

> Status: not yet implemented.

### Library

The user's personal collection of reusable components. Stores custom card styles, tile configurations, Token templates, and other design elements that can be reused across Projects.

Library is user-created content, not official/built-in templates.

> Status: currently implemented as TemplateLibrary (official templates); needs repositioning to match this definition.

### History

Two-tier system for tracking changes:

1. **Undo/Redo** — fine-grained, immediate operation log. In-memory only; lost when the session ends. Covers individual edit actions (change a color, delete a card, move a tile).

2. **Version Snapshots** — user-initiated named snapshots. Persisted to storage. Allows reverting to a previous state, comparing versions, and branching from an older snapshot.

> Status: not yet implemented.

---

## Removed Concepts

### ~~Assets~~

Decided against a standalone Assets concept. Asset management (images, icons, styles) is handled directly within each editor (Board, Cards, Tokens) and the Library. This reduces cognitive overhead — users manage assets where they use them.

If cross-editor asset sharing becomes a clear need in the future, Library can be expanded to serve as a shared asset hub.

---

## Bounded Contexts

### Design Context

The core domain. Users create and edit board game designs.

**Aggregates:**

- **Project** (aggregate root) — contains Board, Cards, Rules, Tokens
- **Board** — contains Tiles; each Tile has layout position, appearance, and effects
- **Cards** — contains Decks; each Deck contains Cards
- **Rules** — a single value object per Project representing global game settings
- **Tokens** — contains Token definitions; each Token has appearance and game semantics

**Key invariants:**

- A Board tile's "draw card" effect must reference an existing Deck.
- Rules define valid ranges (e.g., minPlayers <= maxPlayers).
- Each Deck has at least one Card.

### Library Context

User's reusable component collection, operating across Projects.

**Aggregates:**

- **Library** (aggregate root) — contains reusable component templates

**Key invariants:**

- Library items are owned by a single user.
- A Library item can be instantiated into any Project without creating a dependency (copy, not reference).

### History Context

Change tracking and version management within a Project.

**Aggregates:**

- **EditLog** — in-memory undo/redo stack per editing session
- **VersionSnapshot** — persisted, named snapshots of a Project's state

**Key invariants:**

- Undo/Redo operates on the current session only.
- Version Snapshots are immutable once created.
- A Snapshot captures the full Project state (Board + Cards + Rules + Tokens).

### Publishing Context

Exporting a Project into a playable Game.

**Aggregates:**

- **Game** — an exported artifact derived from a Project at a point in time

**Key invariants:**

- A Game is a read-only snapshot; editing happens in the Project.
- A Game references the Version Snapshot it was built from (if applicable).

---

## Relationships

```
Project (1) ──contains──> (1) Board
Project (1) ──contains──> (N) Decks of Cards
Project (1) ──contains──> (1) Rules
Project (1) ──contains──> (N) Tokens
Project (1) ──exports───> (N) Games

Board Tile ──triggers──> Card Draw (references a Deck)

Library ──provides templates to──> Project (copy, not reference)

History/EditLog ──tracks──> Project edits (in-memory)
History/VersionSnapshot ──captures──> Project state (persisted)

Game ──derived from──> Project (+ optional VersionSnapshot reference)
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| No standalone Assets concept | Reduces cognitive overhead; assets managed where they're used. Library can expand later if cross-editor sharing is needed. |
| Project not yet implemented | Keep flexibility on whether to introduce Project as an explicit feature or keep it implicit. |
| History split into two tiers | Undo/Redo (in-memory) is simple and fast; Version Snapshots (persisted) are independent and can be built later without coupling. |
| Library = user content only | Official templates are a separate concern; Library focuses on the user's own reusable elements. |
| Cards independent from Board | Clean separation of concerns; Board tiles only reference Decks via a "draw" action. |
| Rules = global only | Tile-specific and card-specific effects belong to Board and Cards respectively, keeping Rules focused. |
