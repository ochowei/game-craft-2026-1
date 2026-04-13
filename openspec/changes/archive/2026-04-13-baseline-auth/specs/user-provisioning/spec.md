## ADDED Requirements

### Requirement: User profile created on first sign-in
The system SHALL create a Firestore document at `/users/{userId}/profile` when a user signs in for the first time.

#### Scenario: First-time sign-in
- **WHEN** a user completes Google sign-in and no document exists at `/users/{userId}/profile`
- **THEN** a document is created with fields: `displayName`, `email`, `photoURL`, `createdAt` (server timestamp), and `lastLoginAt` (server timestamp)

### Requirement: User profile updated on subsequent sign-ins
The system SHALL update the `lastLoginAt` field on each sign-in without overwriting `createdAt` or other existing fields.

#### Scenario: Returning user signs in
- **WHEN** a user signs in and a profile document already exists
- **THEN** the `lastLoginAt` field is updated to the current server timestamp
- **THEN** the `createdAt` field remains unchanged

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
