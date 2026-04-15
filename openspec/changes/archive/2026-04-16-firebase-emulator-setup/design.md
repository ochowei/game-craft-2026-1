## Context

GameCraft uses Firebase Auth and Firestore in production. All local development currently hits the production project — there's no isolation between dev and prod data. The codebase connects to Firebase in `src/lib/firebase.ts` using environment variables from `.env.local`, and uses a named Firestore database via `VITE_FIREBASE_FIRESTORE_DATABASE_ID`.

## Goals / Non-Goals

**Goals:**
- Local dev can run fully against emulated Firebase services (Auth + Firestore)
- Single env var toggle (`VITE_USE_EMULATOR`) controls emulator vs production
- Existing `npm run dev` behavior is unchanged (connects to production)
- Emulator data persists across restarts via `--import`/`--export-on-exit`
- Seed script provides deterministic test data

**Non-Goals:**
- Production data export/import (deferred — complex format conversion, PII concerns)
- Emulator-backed integration tests (current tests use mocks, separate effort)
- Firestore security rules testing (open access for now)

## Decisions

### 1. Environment variable toggle over separate Firebase config

Use `VITE_USE_EMULATOR=true` to conditionally call `connectAuthEmulator` / `connectFirestoreEmulator` on the existing `auth` and `db` instances.

**Why not a separate firebase config?** The emulator doesn't need different project config — it intercepts traffic from the same SDK instances. A single env var is simpler and matches Firebase's recommended pattern.

### 2. Separate terminals over `emulators:exec`

Provide `emulator:start` and `dev:emu` as separate npm scripts instead of a combined `emulators:exec` command.

**Why?** `emulators:exec` bundles Vite as a child process of the emulator — logs are mixed, Ctrl+C shutdown can interrupt data export, and you can't restart one without the other. Separate terminals give independent control.

### 3. Seed script over production data export

Use a `scripts/seed-emulator.ts` script with Firebase Admin SDK instead of `gcloud firestore export` → GCS → local conversion.

**Why?**
- GCS export format is incompatible with emulator `--import` — requires a non-trivial conversion step
- `gcloud` CLI needs IAM permissions setup
- Production data may contain PII
- Seed data is deterministic and version-controlled

### 4. Named database handling

The codebase uses `VITE_FIREBASE_FIRESTORE_DATABASE_ID` for a named Firestore database. The emulator defaults to `(default)`.

**Decision:** When using the emulator, set `VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)` in `.env.local` or use an `.env.emulator` file. Document this clearly.

**Why not configure the emulator for named databases?** Firebase Emulator support for named databases is limited and adds configuration complexity for no benefit in local dev.

## Risks / Trade-offs

- **[Emulator ≠ Production]** → The emulator approximates Firestore behavior but isn't identical (e.g., no billing limits, different consistency model). Mitigation: use for development convenience, not as a production correctness guarantee.
- **[Seed data drift]** → Seed script may drift from actual production schema over time. Mitigation: keep seed script aligned with domain types in `src/domain/`.
- **[Java dependency]** → Firestore emulator requires Java JRE 11+. Mitigation: document in prerequisites; most dev machines have Java or can install it easily.
