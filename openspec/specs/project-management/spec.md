## ADDED Requirements

### Requirement: Project domain type
The system SHALL define a `Project` type in `src/domain/project.ts` representing a board game design workspace, with fields: `id` (string), `ownerId` (string, Firebase uid), `members` (map of uid → role string), `name` (string), `description` (string, optional), `thumbnail` (string URL, optional), `createdAt` (timestamp), `updatedAt` (timestamp), and `schemaVersion` (number, currently `1`). The `Role` type SHALL be the union `'owner' | 'editor' | 'viewer'`.

#### Scenario: Project type has required fields
- **WHEN** a Project is constructed for a new user workspace
- **THEN** `id`, `ownerId`, `members`, `name`, `createdAt`, `updatedAt`, and `schemaVersion` are present

#### Scenario: New project defaults
- **WHEN** a project is created for user `uid_A` with name "My Project"
- **THEN** `ownerId` equals `uid_A` AND `members[uid_A]` equals `'owner'` AND `schemaVersion` equals `1`

#### Scenario: Roles union includes editor and viewer
- **WHEN** membership is written for user `uid_B` with role `'editor'`
- **THEN** the write is accepted by the type system AND by Firestore rules

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
Firestore security rules SHALL enforce that a project document at `projects/{projectId}` is readable only by members, creatable only when the creator is the sole initial owner, updatable under two constraints: the caller is a member, the `ownerId` is unchanged, AND if the caller is not the owner the `members` map is also unchanged. Delete SHALL remain owner-only.

#### Scenario: Non-member cannot read project
- **WHEN** an authenticated user who is not in `members` reads `projects/{pid}`
- **THEN** the read is denied

#### Scenario: Owner can manage membership via update
- **WHEN** the owner updates `projects/{pid}.members` to add `uid_B` with role `'editor'`
- **THEN** the update succeeds

#### Scenario: Editor cannot change membership
- **WHEN** an `editor` member attempts to update `projects/{pid}.members`
- **THEN** the update is denied

#### Scenario: Editor can update non-membership fields
- **WHEN** an `editor` member updates `projects/{pid}.name` while `members` is unchanged
- **THEN** the update succeeds

### Requirement: Security rules for design subcollection
Firestore security rules SHALL allow read on `projects/{projectId}/design/{docId}` for any member of the parent project, and SHALL allow write only for members whose role is `'owner'` or `'editor'`. Viewers SHALL be denied write access.

#### Scenario: Non-member cannot read design document
- **WHEN** a non-member reads `projects/{pid}/design/board`
- **THEN** the read is denied

#### Scenario: Editor can write design document
- **WHEN** an `editor` member writes `projects/{pid}/design/cards`
- **THEN** the write succeeds

#### Scenario: Viewer can read but not write design document
- **WHEN** a `viewer` member reads `projects/{pid}/design/board`
- **THEN** the read succeeds
- **WHEN** the same viewer writes `projects/{pid}/design/board`
- **THEN** the write is denied

### Requirement: Security rules for projectRefs
Firestore security rules SHALL allow a user to read only their own entries under `users/{uid}/projectRefs/{projectId}`. Writes SHALL be allowed when the caller is the owner of the `users/{uid}/...` path, OR when the caller is the `ownerId` of the referenced `projects/{projectId}` (so a project owner can add, remove, or update ref entries for any member).

#### Scenario: User reads their own projectRefs
- **WHEN** a user reads `users/{theirUid}/projectRefs/{pid}`
- **THEN** the read is allowed

#### Scenario: User cannot read another user's projectRefs
- **WHEN** a user reads `users/{otherUid}/projectRefs/{pid}`
- **THEN** the read is denied

#### Scenario: Project owner writes projectRef entry for another member
- **WHEN** owner `uid_A` of project `p_1` writes `users/uid_B/projectRefs/p_1` to add `uid_B` as a member
- **THEN** the write is allowed

#### Scenario: Non-owner cannot write another user's projectRefs
- **WHEN** a non-owner `uid_B` writes `users/uid_C/projectRefs/p_1`
- **THEN** the write is denied

### Requirement: Membership primitive extensible to Phase 2
Security rules SHALL express access checks in terms of membership (`members[auth.uid] != null`) rather than pure ownership, so that Phase 2 can introduce non-owner roles without changing read/write rules for the `projects/{pid}` document or its `design/*` subcollection.

#### Scenario: Rule structure uses membership, not ownerId
- **WHEN** Phase 2 adds a member with role `'editor'`
- **THEN** the same read/update rules already permit that member's access without modification

### Requirement: Membership management actions on ProjectContext
The `ProjectProvider` SHALL expose `addMember(projectId, email, role)`, `removeMember(projectId, targetUid)`, `changeRole(projectId, targetUid, newRole)`, and `leaveProject(projectId)` actions. All mutations SHALL be transactional over `projects/{projectId}` and `users/{targetUid}/projectRefs/{projectId}` so the pair never diverges.

#### Scenario: addMember resolves email and writes membership
- **WHEN** the owner calls `addMember('p_1', 'alice@example.com', 'editor')` and a user with that email exists
- **THEN** the resolved user's uid is added to `projects/p_1.members` with role `'editor'`
- **THEN** `users/{resolvedUid}/projectRefs/p_1` is created with `role: 'editor'` and `addedAt`
- **THEN** both writes commit in a single transaction

#### Scenario: addMember with unresolved email rejects
- **WHEN** the owner calls `addMember('p_1', 'noone@example.com', 'editor')` and no user with that email exists
- **THEN** the action throws a typed error `{ code: 'user-not-found' }`
- **THEN** no Firestore writes occur

#### Scenario: removeMember deletes both documents transactionally
- **WHEN** the owner calls `removeMember('p_1', 'uid_B')`
- **THEN** `projects/p_1.members[uid_B]` is deleted AND `users/uid_B/projectRefs/p_1` is deleted
- **THEN** both deletions commit together

#### Scenario: removeMember rejects removing the owner
- **WHEN** `removeMember('p_1', ownerId)` is called
- **THEN** the action throws without performing any writes

#### Scenario: changeRole updates both sides
- **WHEN** the owner calls `changeRole('p_1', 'uid_B', 'viewer')`
- **THEN** `projects/p_1.members[uid_B]` becomes `'viewer'` AND `users/uid_B/projectRefs/p_1.role` becomes `'viewer'`

#### Scenario: leaveProject removes self
- **WHEN** a non-owner member calls `leaveProject('p_1')`
- **THEN** the same transactional removal runs with the caller's own uid as the target

### Requirement: User lookup by email
The application SHALL provide a `lookupUserByEmail(email): Promise<{ uid, displayName, photoURL } | null>` helper. It SHALL query `publicProfile/main` documents across all users via a collection-group query with exact-match (after trimming and lowercasing the input). Returns `null` if no user matches.

#### Scenario: Exact-match lookup returns user metadata
- **WHEN** `lookupUserByEmail('alice@example.com')` is called and a user with that email has `publicProfile/main`
- **THEN** the returned object contains that user's `uid`, `displayName`, and `photoURL`

#### Scenario: Lookup normalizes input
- **WHEN** `lookupUserByEmail('  Alice@Example.com  ')` is called
- **THEN** the lookup matches the same user as for `'alice@example.com'`

#### Scenario: No match returns null
- **WHEN** `lookupUserByEmail('nobody@example.com')` is called and no user has that email
- **THEN** the returned value is `null`

### Requirement: ShareDialog UI
The application SHALL provide a `ShareDialog` component that displays the project's current members (avatar, display name, email, role), allows the owner to add a member by email with a role picker, change a member's role, or remove a member. The dialog SHALL render a disclaimer that concurrent edits are last-write-wins.

#### Scenario: Owner sees share action
- **WHEN** the owner interacts with their project on `ProjectListScreen`
- **THEN** a "Share" action is visible for that project

#### Scenario: Non-owner does not see share action
- **WHEN** a non-owner (editor or viewer) interacts with a project they do not own
- **THEN** no "Share" action is visible; a "Leave" action is visible instead

#### Scenario: Unknown email surfaces clear error
- **WHEN** the owner enters an email with no matching GameCraft account
- **THEN** the dialog renders the message "This user hasn't signed in to GameCraft yet — ask them to sign in first."

#### Scenario: Remove a member
- **WHEN** the owner clicks Remove on a member row and confirms
- **THEN** `removeMember` is invoked with that member's uid

### Requirement: Role-aware editor UI
Editor components (`BoardEditor`, `CardDesigner`, `RulesEditor`, `TokensEditor`) SHALL consult the current user's role on the active project and disable all mutation controls when the role is `'viewer'`. A read-only banner SHALL be rendered at the top of the editor in that case.

#### Scenario: Viewer sees read-only banner
- **WHEN** a user opens a project where their role is `'viewer'`
- **THEN** the editor renders a read-only banner
- **THEN** all input fields and action buttons are disabled

#### Scenario: Editor has full access
- **WHEN** a user opens a project where their role is `'editor'`
- **THEN** no read-only banner is rendered AND all controls are interactive

#### Scenario: Role changes apply on snapshot
- **WHEN** the owner changes a member's role from `'editor'` to `'viewer'` while that member has the editor open
- **THEN** within one Firestore snapshot the banner appears and controls disable

### Requirement: Role badge on project list
`ProjectListScreen` SHALL render a role badge on each project card for any role other than `'owner'`. Owner cards SHALL NOT render a badge.

#### Scenario: Editor card shows Editor badge
- **WHEN** a user who is an `editor` on project `p_1` views the list
- **THEN** the `p_1` card shows a badge labeled "Editor"

#### Scenario: Owner card hides badge
- **WHEN** the same user views a project they own
- **THEN** no badge is rendered
