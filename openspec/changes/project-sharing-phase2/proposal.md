## Why

Phase 1 introduced `Project` as an aggregate with a `members: { [uid]: Role }` map, but Phase 1 only ever wrote `members[ownerId] = 'owner'`. There is no UI for inviting or removing collaborators, no role beyond `owner`, and no way to display a collaborator's name without leaking uids. Multiple real-world flows (two designers iterating on the same board, a mentor reviewing a student's rules, a playtester with read-only access) therefore require either sharing a Google account or manual backend edits — both unacceptable.

Phase 2 delivers the end-to-end sharing experience:

- The owner types a collaborator's email, picks a role, and the collaborator gets access on their next page load.
- Collaborators see the project in their own project list with a role badge; non-owner roles see a read-only or restricted UI.
- Members can be removed at any time; removing a member revokes all access immediately.

Phase 2 takes full advantage of the Phase 1 schema and the `isMember` rule primitive — no data migration is required. The only new collection is `users/{uid}/publicProfile/main`, a world-readable subset of the profile (displayName, email, photoURL) needed to (a) resolve invitees by email and (b) render member lists in the share dialog.

## What Changes

- **Roles.** Extend the allowed values in `members[uid]` from `'owner'` to `'owner' | 'editor' | 'viewer'`. Introduce a `Role` union in `src/domain/project.ts`.
- **Public profile collection.** Add `users/{uid}/publicProfile/main` (`displayName`, `email`, `photoURL`, `updatedAt`). Maintained by extending `provisionUserProfile` on every sign-in. Read by any authenticated user; write by owner only.
- **Email → uid lookup.** Resolve invitees via `where('email', '==', typedEmail)` on the `users` collection, scoped to `publicProfile/main` documents. Exact match only, no enumeration APIs.
- **Project metadata mutation rules.** Update `projects/{pid}` rules so non-owner members cannot change `ownerId` or `members`. Only the owner can modify membership.
- **Design-doc write gating.** `projects/{pid}/design/*` writes require `role != 'viewer'` (owner + editor can write; viewer is read-only).
- **Share dialog UI.** New `ShareDialog` accessible from `ProjectListScreen` (and eventually from inside the editor). Lists current members with avatar + role + "Remove" action; text input + role picker + "Add" button; displays a clear error when email isn't found in the directory ("This user hasn't signed in to GameCraft yet — ask them to sign in first.").
- **Membership actions on `ProjectContext`.** `addMember(projectId, email, role)`, `removeMember(projectId, uid)`, `changeRole(projectId, uid, role)`. All run as `runTransaction` so `projects/{pid}.members` and `users/{targetUid}/projectRefs/{pid}` stay in sync.
- **Role-aware UI.** Editor gates destructive / metadata actions by role. Viewer role disables inputs and hides `New project` inside an opened project. Role badge on project cards in `ProjectListScreen` for non-owned projects.
- **Project delete stays owner-only.** Removing yourself from a project you don't own deletes only your `projectRefs` entry and your `members[uid]` mapping (a "leave" action, distinct from owner's "delete project").

## Capabilities

### Modified Capabilities

- `project-management` — membership-management actions, role-aware UI gating, ShareDialog, leave-project, rules for non-owner mutation constraints.
- `user-provisioning` — `provisionUserProfile` also writes `users/{uid}/publicProfile/main` on every sign-in; rules add a read-all-authenticated policy for that doc.

### New Capabilities

- None. The schema groundwork is already in `project-management`; Phase 2 extends it.

## Impact

- **New files**
  - `src/components/ShareDialog.tsx` — modal with member list + add-by-email + role controls.
  - `src/components/RoleBadge.tsx` — small pill showing "Owner" / "Editor" / "Viewer" on project cards.
  - `src/hooks/useUserLookup.ts` — `lookupUserByEmail(email): Promise<{ uid, displayName, photoURL } | null>`.
- **Modified files**
  - `src/domain/project.ts` — widen `Role = 'owner' | 'editor' | 'viewer'`; add `PUBLIC_PROFILE_PATH` helper.
  - `src/lib/firebase.ts` — `provisionUserProfile` mirrors displayName/email/photoURL to `publicProfile/main`.
  - `src/contexts/ProjectContext.tsx` — add `addMember` / `removeMember` / `changeRole` / `leaveProject`; expose per-project role on `ProjectMeta`.
  - `src/components/ProjectListScreen.tsx` — show `RoleBadge` for non-owned projects; expose `Share` action; `Delete` only for owner, `Leave` for non-owner.
  - `src/components/BoardEditor.tsx`, `CardDesigner.tsx`, `RulesEditor.tsx`, `TokensEditor.tsx` — viewer role disables mutation controls.
  - `firestore.rules` — widen `isMember` to allow any non-null role; gate `design/*` writes on `role in ['owner', 'editor']`; gate `projects/{pid}` metadata updates so non-owners cannot change `ownerId` or `members`; new `/users/{uid}/publicProfile/main` block.
  - `scripts/seed-emulator.ts` — seed `publicProfile` for the demo user; add a second demo user as an editor on the demo project for manual testing.
- **Dependencies** — No new runtime dependencies. Uses existing `firebase/firestore` APIs.
- **Out of scope (Phase 2.5+ or later)**
  - Magic-link / URL-based sharing (deferred to Phase 2.5 if the "show my WIP to a friend" use case emerges).
  - Pending-invite docs for emails that don't yet belong to a GameCraft user. Phase 2 returns a clear error instead; users are expected to have the invitee sign in first.
  - Ownership transfer (single-owner assumption kept; rule prevents `ownerId` mutation).
  - Real-time presence / soft locking. Write conflicts remain last-write-wins; this is documented in the Share dialog.
  - Fine-grained per-domain permissions (e.g. "can edit rules but not board"). Roles remain project-wide.
  - Migrating Library to Firestore (still Phase 2.5 or later, unchanged from Phase 1 deferral).
- **Breaking behaviour** — None. Existing Phase 1 projects have `members[ownerId] = 'owner'` which validates under the widened role union. No migration code required.
