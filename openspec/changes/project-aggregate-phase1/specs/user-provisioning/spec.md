## MODIFIED Requirements

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

## ADDED Requirements

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
