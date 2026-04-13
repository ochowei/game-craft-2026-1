## Why

Tests exist locally (`npm test` — 23 passing via Vitest) but there is no CI pipeline to run them automatically. PRs can be merged with broken tests because nothing enforces the test suite on push or pull request. A GitHub Actions workflow ensures every change is validated before merge.

## What Changes

- Add a GitHub Actions workflow file (`.github/workflows/test.yml`) that runs `npm test` on push to `main` and on all pull requests.
- The workflow will also run the TypeScript type checker (`npm run lint`) as part of the same pipeline.

## Capabilities

### New Capabilities
- `ci-test-workflow`: GitHub Actions workflow that runs tests and type checking on push/PR events.

### Modified Capabilities
<!-- No spec-level behavior changes -->

## Impact

- **New files**: `.github/workflows/test.yml`
- **Systems**: GitHub Actions CI — will consume GitHub Actions minutes on push to main and on PRs.
- **No code changes** to the application itself.
