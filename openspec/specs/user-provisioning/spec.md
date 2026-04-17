## ADDED Requirements

### Requirement: User profile created on first sign-in
The system SHALL create two Firestore documents when a user signs in for the first time: `/users/{userId}/profile/main` (private) with fields `displayName`, `email`, `photoURL`, `createdAt`, `lastLoginAt`, and optional `lastOpenedProjectId`; AND `/users/{userId}/publicProfile/main` (world-readable-to-authenticated) with fields `displayName`, `email`, `photoURL`, `updatedAt`.

#### Scenario: First-time sign-in writes both documents
- **WHEN** a user completes Google sign-in and no document exists at `/users/{userId}/profile/main`
- **THEN** `/users/{userId}/profile/main` is created with `displayName`, `email`, `photoURL`, `createdAt`, `lastLoginAt`
- **THEN** `/users/{userId}/publicProfile/main` is created with `displayName`, `email`, `photoURL`, `updatedAt`

#### Scenario: lastOpenedProjectId is not written by provisioning
- **WHEN** a new user is provisioned
- **THEN** `lastOpenedProjectId` is absent from `/users/{userId}/profile/main`

### Requirement: User profile updated on subsequent sign-ins
The system SHALL update `lastLoginAt` on `/users/{userId}/profile/main` AND mirror `displayName` / `email` / `photoURL` (plus `updatedAt`) onto `/users/{userId}/publicProfile/main` on each sign-in. No other existing fields (including `createdAt`, `lastOpenedProjectId`) SHALL be overwritten.

#### Scenario: Returning user refreshes public profile
- **WHEN** a user whose Google profile displayName changed signs in
- **THEN** `/users/{uid}/publicProfile/main.displayName` is updated to the new value on this sign-in

#### Scenario: Returning user preserves private fields
- **WHEN** a user with `lastOpenedProjectId: 'p_1'` signs in
- **THEN** `lastLoginAt` on `profile/main` is updated AND `lastOpenedProjectId` remains `'p_1'` AND `createdAt` remains unchanged

### Requirement: Provisioning is idempotent
The profile write operation SHALL use a merge strategy so that concurrent or duplicate writes do not corrupt the document.

#### Scenario: Concurrent sign-in from multiple tabs
- **WHEN** a user signs in from two browser tabs simultaneously
- **THEN** both writes succeed and the resulting document is valid with all required fields

### Requirement: Firestore rules protect user profile
Firestore security rules SHALL allow a user to read and write only their own profile document at `/users/{userId}/profile`.

#### Scenario: Owner reads their profile
- **WHEN** an authenticated user reads `/users/{userId}/profile` where `userId` matches their auth UID
- **THEN** the read is allowed

#### Scenario: Owner writes their profile
- **WHEN** an authenticated user writes to `/users/{userId}/profile` where `userId` matches their auth UID
- **THEN** the write is allowed

#### Scenario: Non-owner attempts to read another user's profile
- **WHEN** an authenticated user reads `/users/{otherUserId}/profile` where `otherUserId` does not match their auth UID
- **THEN** the read is denied

#### Scenario: Unauthenticated access to profile
- **WHEN** an unauthenticated request reads or writes `/users/{userId}/profile`
- **THEN** the request is denied

### Requirement: Profile data sourced from Firebase Auth
The profile document fields SHALL be populated from the Firebase Auth user object returned by `signInWithPopup`.

#### Scenario: Profile fields match auth data
- **WHEN** a profile document is created or updated
- **THEN** `displayName` matches `user.displayName`, `email` matches `user.email`, and `photoURL` matches `user.photoURL` from the Firebase Auth user object

### Requirement: Profile carries optional lastOpenedProjectId
The `/users/{userId}/profile/main` document SHALL carry an optional `lastOpenedProjectId: string` field that records the most recently opened project for routing decisions on subsequent logins. This field is written by the project-management capability (see `openProject`), not by provisioning.

#### Scenario: Field is written when a project is opened
- **WHEN** the user opens project `p_1`
- **THEN** `/users/{uid}/profile/main.lastOpenedProjectId` is updated to `'p_1'` via `setDoc` with `{ merge: true }`

#### Scenario: Field is cleared when the referenced project no longer exists
- **WHEN** on login the app reads `lastOpenedProjectId: 'p_old'` but `projects/p_old` does not exist (or the user is no longer a member)
- **THEN** the app clears `lastOpenedProjectId` from the profile AND routes to `ProjectListScreen`

#### Scenario: Field absent for new users
- **WHEN** a newly-provisioned user has never opened a project
- **THEN** `lastOpenedProjectId` is absent from the profile document

### Requirement: Public profile is world-readable to authenticated users
Firestore security rules SHALL allow any authenticated user to read any `users/{uid}/publicProfile/main` document. Writes SHALL be restricted to the document owner (`request.auth.uid == uid`). This enables user lookup by email for invite flows without exposing the private `profile/main` fields.

#### Scenario: Authenticated user can read another user's public profile
- **WHEN** authenticated user `uid_A` reads `users/uid_B/publicProfile/main`
- **THEN** the read is allowed

#### Scenario: Unauthenticated user cannot read public profile
- **WHEN** an unauthenticated request reads `users/uid_B/publicProfile/main`
- **THEN** the request is denied

#### Scenario: User cannot write another user's public profile
- **WHEN** user `uid_A` writes `users/uid_B/publicProfile/main`
- **THEN** the write is denied

#### Scenario: Public profile fields are restricted
- **WHEN** the owner writes `/users/{uid}/publicProfile/main` with a field other than `displayName`, `email`, `photoURL`, `updatedAt`
- **THEN** the write is denied by rules field-shape validation

### Requirement: Public profile supports collection-group email lookup
The application SHALL use a collection-group query on `publicProfile` with `where('email', '==', trimmedLowercasedEmail)` to resolve an email to a uid. The rules and indexes SHALL permit this query for any authenticated caller.

#### Scenario: Collection-group query returns matching public profile
- **WHEN** an authenticated user runs a collection-group query on `publicProfile` filtered by `email`
- **THEN** the query returns zero or one matching documents

#### Scenario: Query without authentication fails
- **WHEN** an unauthenticated caller attempts the same query
- **THEN** the query is rejected
