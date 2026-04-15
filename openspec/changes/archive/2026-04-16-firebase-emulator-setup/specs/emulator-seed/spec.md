## ADDED Requirements

### Requirement: Seed script populates emulator with test data
The project SHALL include a seed script at `scripts/seed-emulator.ts` that connects to the running Firestore emulator and populates it with sample documents aligned with the domain model.

#### Scenario: Run seed script against running emulator
- **WHEN** the emulator is running AND developer runs `npm run emulator:seed`
- **THEN** the script connects to Firestore at `localhost:8080` via `FIRESTORE_EMULATOR_HOST` and inserts sample documents

#### Scenario: Seed script uses domain types
- **WHEN** the seed script creates documents
- **THEN** the data structure matches the types defined in `src/domain/`

### Requirement: Seed script npm command
The project SHALL provide an `emulator:seed` npm script that sets `FIRESTORE_EMULATOR_HOST=localhost:8080` and runs the seed script via `tsx`.

#### Scenario: Seed command
- **WHEN** developer runs `npm run emulator:seed`
- **THEN** `FIRESTORE_EMULATOR_HOST` is set to `localhost:8080` AND `tsx scripts/seed-emulator.ts` is executed
