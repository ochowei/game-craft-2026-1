## 1. Workflow File

- [x] 1.1 Create `.github/workflows/test.yml` with a single job that checks out code, sets up Node 20, runs `npm ci`, then runs `npm run lint` and `npm test`
- [x] 1.2 Configure triggers: `push` to `main` and `pull_request` targeting `main`

## 2. Verification

- [x] 2.1 Verify the workflow YAML is valid syntax
- [x] 2.2 Confirm `npm run lint` and `npm test` both pass locally before pushing
