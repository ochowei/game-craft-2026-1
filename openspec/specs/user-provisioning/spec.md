## ADDED Requirements

### Requirement: User profile created on first sign-in
The system SHALL create a Firestore document at `/users/{userId}/profile/main` when a user signs in for the first time, with fields: `displayName`, `email`, `photoURL`, `createdAt` (server timestamp), and `lastLoginAt` (server timestamp). The document MAY also carry an optional `lastOpenedProjectId` (string) that is populated later by project-management actions; it is NOT set during provisioning.

#### Scenario: First-time sign-in
- **WHEN** a user completes Google sign-in and no document exists at `/users/{userId}/profile/main`
- **THEN** a document is created with `displayName`, `email`, `photoURL`, `createdAt`, and `lastLoginAt`
- **THEN** `lastOpenedProjectId` is NOT written by provisioning (it is absent until the user opens a project)

### Requirement: User profile updated on subsequent sign-ins
The system SHALL update the `lastLoginAt` field on each sign-in without overwriting `createdAt` or any other existing fields, including a previously-set `lastOpenedProjectId`.

#### Scenario: Returning user signs in with a last-opened project
- **WHEN** a user whose profile already carries `lastOpenedProjectId: 'p_1'` signs in
- **THEN** `lastLoginAt` is updated AND `lastOpenedProjectId` remains `'p_1'` AND `createdAt` remains unchanged

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
