## ADDED Requirements

### Requirement: Workflow triggers on push to main
The CI workflow SHALL run when code is pushed to the `main` branch.

#### Scenario: Direct push to main
- **WHEN** a developer pushes commits to the `main` branch
- **THEN** the CI workflow is triggered and runs to completion

### Requirement: Workflow triggers on pull requests
The CI workflow SHALL run when a pull request is opened or updated against the `main` branch.

#### Scenario: PR opened against main
- **WHEN** a pull request targeting `main` is opened or synchronized
- **THEN** the CI workflow is triggered and runs to completion

### Requirement: Workflow runs type checking
The CI workflow SHALL run `npm run lint` (TypeScript type checking via `tsc --noEmit`) and fail the workflow if type errors are found.

#### Scenario: Type checking passes
- **WHEN** the codebase has no TypeScript errors
- **THEN** the lint step passes

#### Scenario: Type checking fails
- **WHEN** the codebase has TypeScript errors
- **THEN** the lint step fails and the overall workflow fails

### Requirement: Workflow runs tests
The CI workflow SHALL run `npm test` (Vitest) and fail the workflow if any test fails.

#### Scenario: All tests pass
- **WHEN** all Vitest tests pass
- **THEN** the test step passes and the workflow succeeds

#### Scenario: A test fails
- **WHEN** one or more Vitest tests fail
- **THEN** the test step fails and the overall workflow fails

### Requirement: Workflow uses Node 20
The CI workflow SHALL use Node.js 20 (LTS) as the runtime environment.

#### Scenario: Node version
- **WHEN** the workflow runs
- **THEN** the Node.js version is 20.x
