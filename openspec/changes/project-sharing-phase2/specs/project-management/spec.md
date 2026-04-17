## MODIFIED Requirements

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

## ADDED Requirements

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
