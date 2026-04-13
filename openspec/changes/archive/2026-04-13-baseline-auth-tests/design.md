## Context

The project uses Vite + React 19 + TypeScript. There is no test infrastructure — no framework, no test utilities, no test scripts. The three auth specs (`auth-context`, `login-screen`, `user-provisioning`) define 22 scenarios that need automated coverage. All auth code depends on Firebase SDK (`firebase/auth`, `firebase/firestore`), which must be mocked in tests.

## Goals / Non-Goals

**Goals:**
- Establish a Vitest-based test setup that works seamlessly with the existing Vite config.
- Create reusable Firebase mocking utilities for auth and Firestore.
- Write tests covering all 22 scenarios across the three auth specs.
- Ensure `npm test` runs all tests and exits with a meaningful status code.

**Non-Goals:**
- E2E or integration tests (e.g., Playwright, Cypress).
- Testing non-auth components (BoardEditor, CardDesigner, etc.).
- Firestore rules testing (requires Firebase emulator, out of scope).
- Code coverage thresholds or CI pipeline setup.

## Decisions

### 1. Vitest over Jest

**Choice**: Vitest as the test runner.

**Alternatives considered**:
- **Jest**: The default in many React projects, but requires separate Babel/SWC config to handle ESM + TypeScript. Vite-based projects often hit config friction with Jest.
- **Vitest**: Native Vite integration, shares the same config and plugin pipeline, supports ESM out of the box, API-compatible with Jest (describe/it/expect).

**Rationale**: The project already uses Vite. Vitest reuses `vite.config.ts` transforms, so there's zero additional bundler configuration.

### 2. jsdom environment for component tests

**Choice**: Use `jsdom` as the Vitest environment for all test files.

**Alternatives considered**:
- **happy-dom**: Faster but less complete DOM implementation — can cause subtle rendering differences with React 19.
- **Per-file environment annotations**: Unnecessary complexity when all tests in this change need a DOM.

**Rationale**: jsdom is the most battle-tested choice for React Testing Library and provides the broadest API compatibility.

### 3. Firebase mocking strategy

**Choice**: Mock the `firebase/auth` and `firebase/firestore` modules at the Vitest level using `vi.mock()`. Provide a shared `src/test/firebase-mocks.ts` utility that exports controllable mock functions (e.g., `mockOnAuthStateChanged`, `mockSignInWithPopup`, `mockSetDoc`, `mockGetDoc`).

**Alternatives considered**:
- **Firebase emulator**: Accurate but requires Java runtime, emulator setup, and startup time. Overkill for unit/component tests.
- **Mocking at the `src/lib/firebase.ts` level**: Would leave the Firebase SDK imports untested and create a leaky abstraction.

**Rationale**: Module-level mocking gives full control over Firebase behavior per test, is fast, and doesn't require external processes. The shared mock file prevents duplication across the three test suites.

### 4. Test file location

**Choice**: Colocated test files next to source — `src/contexts/AuthContext.test.tsx`, `src/components/LoginScreen.test.tsx`, `src/lib/firebase.test.ts`.

**Alternatives considered**:
- **Centralized `src/__tests__/` directory**: Harder to find related tests, disconnected from the code they test.

**Rationale**: Colocation makes it obvious which code has tests and keeps navigation simple.

## Risks / Trade-offs

- **[Mock fidelity]** → Module-level mocks may drift from actual Firebase SDK behavior over time. Mitigation: keep mocks minimal (only mock what's called), and eventually add emulator-based integration tests for critical paths.
- **[React 19 compatibility]** → React Testing Library works with React 19 but some edge cases around concurrent features may surface. Mitigation: pin `@testing-library/react` to a version known to support React 19.
- **[Firestore rules untested]** → The `user-provisioning` spec includes Firestore rules scenarios that can't be tested without the Firebase emulator. Mitigation: document these as requiring emulator tests in a future change; for now, test the client-side logic only.
