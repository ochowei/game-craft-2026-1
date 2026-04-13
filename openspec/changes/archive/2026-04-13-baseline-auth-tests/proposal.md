## Why

The baseline-auth change shipped with 3 specs containing 22 scenarios total, but the project has zero test infrastructure — no test framework, no test files, no test scripts. Without automated tests, regressions in auth gating, user provisioning, and context behavior can only be caught manually. Setting up the test foundation now, while the auth code is fresh, ensures these critical paths stay verified as the codebase grows.

## What Changes

- Install Vitest, React Testing Library, and jsdom as dev dependencies.
- Configure Vitest for the existing Vite + React + TypeScript setup.
- Add a `test` script to `package.json`.
- Create test files that cover the scenarios defined in the three existing auth specs:
  - `auth-context` (8 scenarios) — unit tests for AuthProvider/useAuth with mocked Firebase
  - `login-screen` (7 scenarios) — component tests for LoginScreen rendering, loading, error states
  - `user-provisioning` (5 scenarios) — unit tests for provisionUserProfile with mocked Firestore
- Create shared Firebase mock utilities to avoid duplication across test files.

## Capabilities

### New Capabilities
- `test-infrastructure`: Vitest setup, configuration, shared test utilities, and Firebase mocking patterns for the project.

### Modified Capabilities
<!-- No spec-level behavior changes — this change adds tests for existing specs, not new requirements. -->

## Impact

- **Dependencies**: New dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- **Config**: New `vitest.config.ts` (or section in `vite.config.ts`). Updated `package.json` scripts.
- **Code**: New test files under `src/__tests__/` or colocated `*.test.tsx` files. New `src/test/` directory for shared mocks/utilities.
- **CI**: The new `npm test` script can be integrated into any future CI pipeline.
