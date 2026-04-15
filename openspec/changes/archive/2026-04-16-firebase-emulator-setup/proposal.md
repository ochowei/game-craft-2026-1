## Why

Local development currently hits production Firebase (Auth + Firestore). Any dev work risks modifying real user data, and there's no way to develop or test offline. Firebase Emulator Suite provides local instances of Auth and Firestore, isolating dev from production.

## What Changes

- Add Firebase Emulator Suite configuration (Auth, Firestore, Emulator UI)
- Modify `src/lib/firebase.ts` to conditionally connect to emulators via `VITE_USE_EMULATOR` env var
- Add npm scripts for starting emulators and running Vite in emulator mode
- Add a seed script to populate emulators with test data
- Add Firestore security rules file (open access for now)

## Capabilities

### New Capabilities
- `emulator-connection`: Conditional emulator connection logic in `firebase.ts`, controlled by environment variable
- `emulator-seed`: Seed script to populate emulator with test data using Firebase Admin SDK

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Code**: `src/lib/firebase.ts` gains emulator connection logic
- **Dependencies**: `firebase-tools` (CLI, global install), Java JRE 11+ (runtime dependency for emulator)
- **New files**: `firebase.json`, `.firebaserc`, `firestore.rules`, `scripts/seed-emulator.ts`
- **Config**: `.gitignore` updated for `emulator-data/` and debug logs
- **Existing behavior**: Unchanged — `npm run dev` still connects to production
