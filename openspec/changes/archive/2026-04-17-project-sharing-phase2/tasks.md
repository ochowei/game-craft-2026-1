## 1. Domain & types

- [ ] 1.1 Widen `Role` in `src/domain/project.ts` from `'owner'` to `'owner' | 'editor' | 'viewer'`. Add `ROLES_THAT_CAN_WRITE_DESIGN: Role[] = ['owner', 'editor']`.
- [ ] 1.2 Add `PUBLIC_PROFILE_PATH(uid) = users/${uid}/publicProfile/main` and a `PublicProfile` type (`displayName`, `email`, `photoURL`, `updatedAt`).
- [ ] 1.3 Extend `ProjectMeta` (in `src/contexts/ProjectContext.tsx`) to expose `role: Role` — the current user's role on this project (resolved from `members[user.uid]`).

## 2. Public profile provisioning

- [ ] 2.1 Update `provisionUserProfile` in `src/lib/firebase.ts` to also write `users/{uid}/publicProfile/main` with `{ displayName, email, photoURL, updatedAt: serverTimestamp() }` on every sign-in (create + update branches).
- [ ] 2.2 Update `src/lib/firebase.test.ts` with tests asserting both `profile/main` and `publicProfile/main` get written on create and on returning sign-in.
- [ ] 2.3 Update `scripts/seed-emulator.ts` to seed `publicProfile/main` for `test-user-001`, plus seed a second user `test-user-002` with `publicProfile/main` (so manual testing of add-by-email has a real target).

## 3. Security rules

- [ ] 3.1 Add `match /users/{userId}/publicProfile/main`: `allow read: if isAuthenticated()`; `allow create, update: if isOwner(userId)`; fields restricted to `displayName`, `email`, `photoURL`, `updatedAt`.
- [ ] 3.2 Update `match /users/{userId}/projectRefs/{projectId}`: reads remain owner-only; writes expand to `isOwner(userId) || request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId`. So the project's owner can write membership refs for any member.
- [ ] 3.3 Update `match /projects/{projectId}` `allow update`: in addition to `isMember(resource.data) && ownerId unchanged`, if the caller is NOT the owner, require `request.resource.data.members == resource.data.members` (non-owners cannot change membership).
- [ ] 3.4 Add `match /projects/{projectId}/design/{docId}`: tighten `allow write` to require `resource.data (or request.resource.data for create).members[request.auth.uid] in ['owner', 'editor']` — i.e. viewers are read-only.
- [ ] 3.5 Deploy rules to emulator; verify 8 scenarios in Rules Playground: owner-manage-members allow, editor-manage-members deny, viewer-write-design deny, editor-write-design allow, non-member-read deny, public-profile cross-user-read allow, public-profile cross-user-write deny, project-owner write projectRefs for another uid allow.

## 4. User lookup hook

- [ ] 4.1 Create `src/hooks/useUserLookup.ts` exporting `lookupUserByEmail(email): Promise<{ uid, displayName, photoURL } | null>`. Uses `collectionGroup('publicProfile')` with `where('email', '==', email.toLowerCase().trim())`.
- [ ] 4.2 Unit test with Firestore mocks: exact match returns data; no match returns null; whitespace and case differences normalize.

## 5. Membership actions on ProjectContext

- [ ] 5.1 Add `addMember(projectId, email, role)` to `ProjectContext`: lookup user by email, `runTransaction` writes `projects/{pid}.members[newUid] = role` AND sets `users/{newUid}/projectRefs/{pid}` with `{ role, addedAt }`. Throw a typed error `{ code: 'user-not-found' }` if email is unresolved.
- [ ] 5.2 Add `removeMember(projectId, targetUid)`: `runTransaction` removes the key from members AND deletes `users/{targetUid}/projectRefs/{pid}`. If `targetUid === ownerId`, throw (owner cannot be removed; delete project instead).
- [ ] 5.3 Add `changeRole(projectId, targetUid, newRole)`: `runTransaction` updates `members[targetUid] = newRole` AND updates `users/{targetUid}/projectRefs/{pid}.role`. Reject if `targetUid === ownerId`.
- [ ] 5.4 Add `leaveProject(projectId)`: calls `removeMember(projectId, user.uid)`. Separate from `removeMember` only for naming clarity — UI buttons call different functions.
- [ ] 5.5 Extend `loadProjectsForUser(uid)` to populate `role` on each `ProjectMeta` from `projects/{pid}.members[uid]`.
- [ ] 5.6 Unit tests: add/remove/changeRole happy path; owner removal rejection; add-with-unknown-email rejection; role resolution in loaded list.

## 6. ShareDialog UI

- [ ] 6.1 Create `src/components/ShareDialog.tsx`: modal with sections:
  - Current members: avatar, name, email, role picker (disabled for owner row), Remove button (disabled for owner row).
  - Add form: email input + role picker (default `editor`) + Add button.
  - LWW disclaimer line.
- [ ] 6.2 Wire error display: `user-not-found` → inline message under the email input.
- [ ] 6.3 Unit tests: renders members, add happy path, add with unknown email shows error, remove triggers confirm, role change triggers `changeRole`.

## 7. Role-aware UI

- [ ] 7.1 Create `src/hooks/useActiveRole.ts` returning `Role | null` by reading `useProjects().projects` filtered to `activeProjectId` and pulling `.role`.
- [ ] 7.2 Create `src/components/RoleBadge.tsx`: small pill component; `Owner` (primary), `Editor` (secondary), `Viewer` (muted).
- [ ] 7.3 Update `src/components/ProjectListScreen.tsx`:
  - Show `<RoleBadge>` on every card (hide for `owner`).
  - Owner-only actions: `Rename`, `Delete`, `Share`.
  - Non-owner actions: `Leave`.
  - Share button opens `ShareDialog` with that `projectId` prefilled.
- [ ] 7.4 Update `src/components/BoardEditor.tsx`, `CardDesigner.tsx`, `RulesEditor.tsx`, `TokensEditor.tsx`: if `useActiveRole() === 'viewer'`, disable all mutation controls (inputs `disabled`, click handlers short-circuit) and render a top banner: "You're viewing this project as a Viewer. You can't make changes.".

## 8. App integration

- [ ] 8.1 Wire `ShareDialog` mount into `App.tsx` as a sibling modal driven by a local `shareTargetProjectId: string | null` state; surfaced to `ProjectListScreen` via a callback.
- [ ] 8.2 Verify that the viewer's `useFirestoreDoc` still subscribes — viewers need reads. They just shouldn't dispatch writes. (No code change; confirm via test.)

## 9. Cleanup & docs

- [ ] 9.1 Update `CLAUDE.md`: add "Roles" subsection under "Key conventions" describing owner/editor/viewer + publicProfile.
- [ ] 9.2 Update `openspec/domain-model.md` Project section: mention the three roles.
- [ ] 9.3 Grep for `members[uid] == 'owner'` in `firestore.rules` (Phase 1 assumed owner-only) and update to `isMember` where read-access is intended.

## 10. Verification

- [ ] 10.1 Run `npm run lint` — clean.
- [ ] 10.2 Run `npm run test` — all passing, including new tests for `useUserLookup`, membership actions, `ShareDialog`.
- [ ] 10.3 Manual: seed emulator; sign in as user A; share demo project with user B (editor); sign in as B in another profile / incognito; verify B sees the project with an `Editor` badge and can edit.
- [ ] 10.4 Manual: user A changes user B's role to `Viewer`; in B's tab, verify editor inputs disable on next snapshot (within ~1 s).
- [ ] 10.5 Manual: user A removes user B; in B's tab, the project disappears from the list and any open editor shows a permission-denied toast via `SaveIndicator` error state.
- [ ] 10.6 Manual: user B tries `Leave` on a different shared project; confirms prompt; project disappears from B's list.
- [ ] 10.7 Manual: user A tries to invite `noone@example.com` (no GameCraft account); sees "This user hasn't signed in to GameCraft yet" error.
- [ ] 10.8 Emulator Rules Playground runs all 8 scenarios from 3.5.

## 11. Documentation

- [ ] 11.1 Update `CLAUDE.md` (if not already in 9.1): provider nesting unchanged; add note about role-aware UI pattern via `useActiveRole`.
- [ ] 11.2 Update `openspec/domain-model.md`: Project section lists the three roles and the publicProfile doc.
- [ ] 11.3 Add a short "sharing" section to README if one exists (check first).
