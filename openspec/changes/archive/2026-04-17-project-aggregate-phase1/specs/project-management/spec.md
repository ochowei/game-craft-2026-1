## ADDED Requirements

### Requirement: Project domain type
The system SHALL define a `Project` type in `src/domain/project.ts` representing a board game design workspace, with fields: `id` (string), `ownerId` (string, Firebase uid), `members` (map of uid → role string), `name` (string), `description` (string, optional), `thumbnail` (string URL, optional), `createdAt` (timestamp), `updatedAt` (timestamp), and `schemaVersion` (number, currently `1`).

#### Scenario: Project type has required fields
- **WHEN** a Project is constructed for a new user workspace
- **THEN** `id`, `ownerId`, `members`, `name`, `createdAt`, `updatedAt`, and `schemaVersion` are present

#### Scenario: New project defaults
- **WHEN** a project is created for user `uid_A` with name "My Project"
- **THEN** `ownerId` equals `uid_A` AND `members[uid_A]` equals `'owner'` AND `schemaVersion` equals `1`

### Requirement: Projects stored at top-level Firestore collection
The system SHALL store each project document at `projects/{projectId}` in Firestore, not nested under the user document.

#### Scenario: Project creation writes to top-level collection
- **WHEN** user `uid_A` creates a project
- **THEN** a document is written at `projects/{generatedId}` with `ownerId: uid_A`

### Requirement: Per-user reverse index of projects
The system SHALL maintain a `users/{uid}/projectRefs/{projectId}` document for each project the user is a member of, with fields: `role` (string), `addedAt` (timestamp), and optional `lastOpenedAt` (timestamp).

#### Scenario: Reverse index written on project creation
- **WHEN** user `uid_A` creates project `p_1`
- **THEN** a document is written at `users/uid_A/projectRefs/p_1` with `role: 'owner'`

#### Scenario: Reverse index removed on project deletion
- **WHEN** the owner deletes project `p_1`
- **THEN** both `projects/p_1` and `users/uid_A/projectRefs/p_1` are deleted

### Requirement: Project create is transactional
The system SHALL create the `projects/{projectId}` document and its corresponding `users/{uid}/projectRefs/{projectId}` reverse-index document in a single Firestore transaction, so partial creation is not possible.

#### Scenario: Transaction failure leaves no orphan
- **WHEN** the `runTransaction` call fails during project creation
- **THEN** neither the project document nor the reverse-index document exists

#### Scenario: Transaction success writes both
- **WHEN** `runTransaction` completes for project creation
- **THEN** both documents exist with matching `projectId`

### Requirement: Project delete is transactional
The system SHALL delete the `projects/{projectId}` document and the creator's `users/{uid}/projectRefs/{projectId}` document in a single transaction. In Phase 1 only the owner is a member, so only one reverse-index document needs to be removed.

#### Scenario: Owner deletes a project
- **WHEN** the owner deletes project `p_1`
- **THEN** `projects/p_1` is deleted AND `users/{ownerId}/projectRefs/p_1` is deleted
- **THEN** design subdocuments under `projects/p_1/design/*` are deleted (best-effort client cleanup)

### Requirement: ProjectContext exposes project list and active project
The application SHALL provide a `ProjectProvider` React context that exposes: `projects` (array of project metadata for the signed-in user), `activeProjectId` (string | null), `loading` (boolean), and dispatchers for create / rename / delete / open / closeActive.

#### Scenario: ProjectProvider loads user projects on mount
- **WHEN** a signed-in user mounts the app
- **THEN** ProjectProvider reads `users/{uid}/projectRefs/*`, resolves each to its `projects/{pid}` document, and exposes the result as `projects`

#### Scenario: ProjectProvider reflects live changes
- **WHEN** a project is created, renamed, or deleted
- **THEN** the `projects` array updates without a page reload

### Requirement: Open a project sets it as active
The `ProjectProvider` SHALL provide an `openProject(projectId)` action that sets `activeProjectId` to the given id and updates the user's `lastOpenedProjectId` on their profile document.

#### Scenario: Opening a project updates active state
- **WHEN** `openProject('p_1')` is dispatched
- **THEN** `activeProjectId` becomes `'p_1'`
- **THEN** `users/{uid}/profile/main.lastOpenedProjectId` is updated to `'p_1'`

### Requirement: Closing the active project returns to list
The `ProjectProvider` SHALL provide a `closeActive()` action that clears `activeProjectId`, routing the app back to the `ProjectListScreen`. There is no explicit "save on close" prompt; pending debounced writes SHALL be flushed before the state is cleared.

#### Scenario: Closing flushes pending writes
- **WHEN** the user clicks the "Projects" nav item while an edit is pending
- **THEN** any in-flight debounced write is flushed to Firestore
- **THEN** `activeProjectId` becomes `null`
- **THEN** `ProjectListScreen` is rendered

### Requirement: Rename a project
The `ProjectProvider` SHALL provide a `renameProject(projectId, newName)` action that updates the `name` and `updatedAt` fields on `projects/{projectId}`.

#### Scenario: Successful rename
- **WHEN** the owner dispatches `renameProject('p_1', 'New Name')`
- **THEN** `projects/p_1.name` is `'New Name'` AND `projects/p_1.updatedAt` is updated

### Requirement: ProjectListScreen UI
The application SHALL provide a `ProjectListScreen` component listing all of the user's projects, with controls to create a new project, rename an existing project, delete a project (with confirmation), and open a project.

#### Scenario: List shows all user projects
- **WHEN** the user has 3 projects
- **THEN** `ProjectListScreen` renders 3 project cards with name, description, thumbnail (if any), and updated-at timestamp

#### Scenario: Create new project
- **WHEN** the user clicks "New project" and enters a name
- **THEN** a new project is created AND the user is automatically navigated into the editor with the new project active

#### Scenario: Delete confirmation
- **WHEN** the user initiates a project delete
- **THEN** a confirmation prompt is shown before the transaction runs
- **THEN** deleting a project that is currently active also clears `activeProjectId`

### Requirement: Active project remounts design providers
The application SHALL wrap the four design providers (Rules, Cards, Board, Tokens) in a component keyed by `activeProjectId` so that switching projects unmounts and remounts the entire subtree, fully resetting editor state.

#### Scenario: Switching projects resets design state
- **WHEN** the active project changes from `p_1` to `p_2`
- **THEN** each of the Rules/Cards/Board/Tokens providers unmounts and remounts
- **THEN** no reducer state from `p_1` is observable in `p_2`

### Requirement: Last-opened project memory on profile
The user profile document `users/{uid}/profile/main` SHALL carry an optional `lastOpenedProjectId` field. On app mount for a signed-in user, if the field is set and the referenced project exists and the user is a member, the app SHALL open that project directly. Otherwise it SHALL render `ProjectListScreen`.

#### Scenario: Returning user lands in last project
- **WHEN** the user last opened project `p_1` and it still exists
- **THEN** on next login the app renders the editor with `activeProjectId = 'p_1'`

#### Scenario: Last-opened project was deleted
- **WHEN** `lastOpenedProjectId` points to a project that no longer exists
- **THEN** the app renders `ProjectListScreen` and clears the stale `lastOpenedProjectId`

#### Scenario: No last-opened set
- **WHEN** the user has never opened a project (or cleared it)
- **THEN** the app renders `ProjectListScreen` after login

### Requirement: First-login auto-provisioning
When a signed-in user has no projects (empty `projectRefs`), the application SHALL automatically create a starter project named `My First Project` and set it as active, so the editor is never in an empty state for a new user.

#### Scenario: Brand-new user lands in starter project
- **WHEN** a user signs in for the first time and `projectRefs` is empty
- **THEN** a project named `My First Project` is created transactionally
- **THEN** `activeProjectId` is set to that project
- **THEN** the editor is rendered, not `ProjectListScreen`

### Requirement: Screen navigation includes projects
The `Screen` union in `src/types.ts` SHALL include `'projects'`. The application SHALL route to `ProjectListScreen` when `activeScreen === 'projects'` OR when `activeProjectId` is `null` (regardless of `activeScreen`).

#### Scenario: User clicks Projects nav item
- **WHEN** the user selects the "Projects" item in the nav
- **THEN** `activeScreen` becomes `'projects'` AND `ProjectListScreen` renders

#### Scenario: No active project forces list
- **WHEN** `activeProjectId` is `null`
- **THEN** `ProjectListScreen` is rendered regardless of `activeScreen`

### Requirement: Security rules for projects collection
Firestore security rules SHALL enforce that a project document at `projects/{projectId}` is readable only by members (Phase 1: only the owner), creatable only when the creator is the sole initial owner, updatable only by members without allowing ownership transfer through arbitrary updates, and deletable only by the owner.

#### Scenario: Non-member cannot read project
- **WHEN** an authenticated user who is not in `members` reads `projects/{pid}`
- **THEN** the read is denied

#### Scenario: Owner can read, update, and delete
- **WHEN** the signed-in user's uid matches `ownerId`
- **THEN** reads, updates, and deletes succeed

#### Scenario: Create requires owner to be initial member
- **WHEN** a user attempts to create a project whose `ownerId` does not match their uid OR whose `members[auth.uid]` is not `'owner'`
- **THEN** the create is denied

### Requirement: Security rules for design subcollection
Firestore security rules SHALL allow read and write on `projects/{projectId}/design/{docId}` only for members of the parent project.

#### Scenario: Non-member cannot read design document
- **WHEN** a non-member reads `projects/{pid}/design/board`
- **THEN** the read is denied

#### Scenario: Member can write design document
- **WHEN** a member writes `projects/{pid}/design/cards`
- **THEN** the write succeeds

### Requirement: Security rules for projectRefs
Firestore security rules SHALL allow a user to read and write only their own entries under `users/{uid}/projectRefs/{projectId}`.

#### Scenario: User reads their own projectRefs
- **WHEN** a user reads `users/{theirUid}/projectRefs/{pid}`
- **THEN** the read is allowed

#### Scenario: User cannot read another user's projectRefs
- **WHEN** a user reads `users/{otherUid}/projectRefs/{pid}`
- **THEN** the read is denied

### Requirement: Membership primitive extensible to Phase 2
Security rules SHALL express access checks in terms of membership (`members[auth.uid] != null`) rather than pure ownership, so that Phase 2 can introduce non-owner roles without changing read/write rules for the `projects/{pid}` document or its `design/*` subcollection.

#### Scenario: Rule structure uses membership, not ownerId
- **WHEN** Phase 2 adds a member with role `'editor'`
- **THEN** the same read/update rules already permit that member's access without modification
