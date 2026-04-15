## 1. Firebase CLI Configuration

- [x] 1.1 Run `firebase init` to generate `firebase.json`, `.firebaserc`, and `firestore.rules`
- [x] 1.2 Configure emulator ports in `firebase.json`: Auth 9099, Firestore 8080, UI 4000
- [x] 1.3 Set `firestore.rules` to open access for development

## 2. Gitignore & Environment

- [x] 2.1 Add `emulator-data/`, `firebase-debug.log`, `firestore-debug.log`, `ui-debug.log` to `.gitignore`
- [x] 2.2 Document `VITE_USE_EMULATOR` and named database override in `.env.example` or README

## 3. Emulator Connection Logic

- [x] 3.1 Add `connectAuthEmulator` and `connectFirestoreEmulator` imports to `src/lib/firebase.ts`
- [x] 3.2 Add conditional block: when `VITE_USE_EMULATOR === 'true'`, connect to emulators

## 4. npm Scripts

- [x] 4.1 Add `emulator:start` script to `package.json`
- [x] 4.2 Add `dev:emu` script to `package.json`
- [x] 4.3 Add `emulator:seed` script to `package.json`

## 5. Seed Script

- [x] 5.1 Create `scripts/seed-emulator.ts` with Firebase Admin SDK connecting to `localhost:8080`
- [x] 5.2 Add sample data insertion aligned with domain types from `src/domain/`

## 6. Verification

- [x] 6.1 Run `npm run emulator:start` and confirm emulators start on correct ports
- [x] 6.2 Run `npm run dev:emu` and confirm app connects to emulators (check browser console)
- [x] 6.3 Run `npm run emulator:seed` and confirm data appears in Emulator UI at localhost:4000
- [x] 6.4 Run `npm run dev` and confirm production behavior is unchanged
- [x] 6.5 Run `npm run lint` to confirm no type errors
