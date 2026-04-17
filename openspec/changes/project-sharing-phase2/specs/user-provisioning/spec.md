## MODIFIED Requirements

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

## ADDED Requirements

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
