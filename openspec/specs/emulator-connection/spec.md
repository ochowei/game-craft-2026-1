### Requirement: Conditional emulator connection
The application SHALL connect to Firebase Emulator Suite (Auth and Firestore) when the environment variable `VITE_USE_EMULATOR` is set to `'true'`. When the variable is unset or any other value, the application SHALL connect to production Firebase.

#### Scenario: Emulator mode enabled
- **WHEN** `VITE_USE_EMULATOR` is `'true'`
- **THEN** `connectAuthEmulator(auth, 'http://localhost:9099')` is called AND `connectFirestoreEmulator(db, 'localhost', 8080)` is called

#### Scenario: Production mode (default)
- **WHEN** `VITE_USE_EMULATOR` is unset or not `'true'`
- **THEN** no emulator connection is made AND the app connects to production Firebase as before

### Requirement: Emulator npm scripts
The project SHALL provide npm scripts for running the emulator and Vite in emulator mode as separate commands.

#### Scenario: Start emulators
- **WHEN** developer runs `npm run emulator:start`
- **THEN** Firebase emulators start with Auth on port 9099, Firestore on port 8080, and UI on port 4000, importing from `./emulator-data` and exporting on exit

#### Scenario: Start Vite in emulator mode
- **WHEN** developer runs `npm run dev:emu`
- **THEN** Vite starts on port 3000 with `VITE_USE_EMULATOR=true` set

### Requirement: Firebase configuration files
The project SHALL include `firebase.json` with emulator port configuration, `.firebaserc` with project binding, and `firestore.rules` with open-access rules for development.

#### Scenario: Emulator ports configured
- **WHEN** emulators start via `firebase.json` configuration
- **THEN** Auth runs on 9099, Firestore on 8080, and Emulator UI on 4000

### Requirement: Gitignore updates
The project SHALL gitignore `emulator-data/`, `firebase-debug.log`, `firestore-debug.log`, and `ui-debug.log`.

#### Scenario: Emulator artifacts not tracked
- **WHEN** emulators have been run and generated data/logs
- **THEN** `emulator-data/` and `*-debug.log` files are not tracked by git
