## Context

The project uses Vite + React 19 + TypeScript with Vitest for testing. `npm test` runs `vitest run` (23 tests) and `npm run lint` runs `tsc --noEmit`. There is no CI pipeline. The repo is hosted on GitHub at `ochowei/game-craft-2026-1`.

## Goals / Non-Goals

**Goals:**
- Run tests and type checking automatically on every push to `main` and on every pull request.
- Fail the workflow (and block merge) if tests or type checking fail.
- Keep the workflow simple and fast.

**Non-Goals:**
- Build/deploy pipeline — out of scope.
- Code coverage reporting or thresholds.
- E2E or browser testing.
- Caching optimization beyond npm's default — can be added later if CI time becomes an issue.

## Decisions

### 1. Single workflow with two jobs vs. one job

**Choice**: Single job that runs lint then test sequentially.

**Alternatives considered**:
- **Two parallel jobs** (lint + test): Adds complexity for minimal time savings — both steps are fast (lint ~3s, test ~3s). Parallel jobs also double the checkout/install overhead.

**Rationale**: Sequential in one job is simpler, avoids redundant `npm ci`, and total time is under 30s.

### 2. Node version

**Choice**: Node 20 (LTS). Single version, no matrix.

**Rationale**: The project doesn't need to support multiple Node versions — it's a Vite SPA, not a library. Node 20 is the current LTS.

### 3. Trigger events

**Choice**: `push` to `main` + `pull_request` targeting `main`.

**Rationale**: Covers the two standard cases — direct pushes and PR validation. No need for schedule or manual dispatch.

## Risks / Trade-offs

- **[No Firebase env vars in CI]** → Tests mock Firebase entirely and don't need real credentials. No risk here.
- **[GitHub Actions minutes]** → The workflow is lightweight (~30s). At typical development velocity this is negligible. Mitigation: can add path filters later if needed.
