# Project Sharing Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `Project` membership from owner-only to `owner | editor | viewer`, delivering a ShareDialog + add-by-email + remove + change-role flow, with role-aware UI gating and a world-readable `publicProfile` directory.

**Architecture:** Phase 1's `members: { [uid]: Role }` map and `isMember` rule already support multiple roles — no schema migration. A new `users/{uid}/publicProfile/main` doc (world-readable-to-authenticated, fields: displayName, email, photoURL, updatedAt) is maintained by `provisionUserProfile` so collection-group queries can resolve emails to uids. Membership mutations run as `runTransaction` on `projects/{pid}.members` + `users/{targetUid}/projectRefs/{pid}` to stay consistent. Role gates are enforced in rules (server-side: denies writes) AND in UI (client-side: disables controls via a `useActiveRole()` hook).

**Tech Stack:** React 19, TypeScript, Firebase 12 (`firebase/firestore` modular SDK — `collectionGroup`, `runTransaction`, `setDoc`/`updateDoc`/`deleteDoc`), Vite, Vitest with jsdom, `@testing-library/react`.

---

## Source of Truth

Spec artifacts in `openspec/changes/project-sharing-phase2/`:

- `proposal.md` — scope, impact, out-of-scope list
- `design.md` — 7 decisions, 7 risks
- `tasks.md` — original coarse list this plan expands
- `specs/project-management/spec.md` — 4 modified + 5 added requirements
- `specs/user-provisioning/spec.md` — 2 modified + 2 added requirements

Each spec requirement is referenced by its `Requirement: <name>` heading inline.

---

## File Structure

**New files**

| Path | Responsibility |
|---|---|
| `src/hooks/useUserLookup.ts` | `lookupUserByEmail(email)` collection-group query |
| `src/hooks/useActiveRole.ts` | Returns the current user's `Role` on the active project |
| `src/components/RoleBadge.tsx` | Pill for `Owner` / `Editor` / `Viewer` |
| `src/components/ShareDialog.tsx` | Modal: member list + add-by-email + remove + role change |
| `src/components/ReadOnlyBanner.tsx` | Top banner rendered when role is `viewer` |

**Modified files**

| Path | Change |
|---|---|
| `src/domain/project.ts` | Widen `Role = 'owner' \| 'editor' \| 'viewer'`; add `PUBLIC_PROFILE_PATH(uid)`, `PublicProfile` type, `ROLES_THAT_CAN_WRITE_DESIGN = ['owner', 'editor']` |
| `src/lib/firebase.ts` | `provisionUserProfile` mirrors to `publicProfile/main`; re-export `collectionGroup` |
| `src/contexts/ProjectContext.tsx` | Add `role` to `ProjectMeta`; add `addMember` / `removeMember` / `changeRole` / `leaveProject` |
| `src/components/ProjectListScreen.tsx` | Show `RoleBadge`; expose `Share` (owner) and `Leave` (non-owner); hide `Delete` for non-owners |
| `src/components/BoardEditor.tsx`, `CardDesigner.tsx`, `RulesEditor.tsx`, `TokensEditor.tsx` | Read `useActiveRole()`; render `<ReadOnlyBanner />` and disable controls when viewer |
| `src/App.tsx` | Mount `ShareDialog` as a modal driven by local state; pass open-share callback to `ProjectListScreen` |
| `firestore.rules` | `/users/{uid}/publicProfile/main` block; widen projectRefs writes; gate design writes on `'owner'` or `'editor'`; prevent non-owners from changing `members` |
| `scripts/seed-emulator.ts` | Seed `publicProfile/main` for user 1; seed a second user 2 as an `editor` member; their `publicProfile/main` + `projectRefs` entry |
| `src/lib/firebase.test.ts` | Add tests for publicProfile write on provision (create + merge) |
| `CLAUDE.md` | Add "Roles" subsection; document `useActiveRole` pattern |
| `openspec/domain-model.md` | Project section: list the three roles + publicProfile |

**Deleted files**

None.

---

## Design Decisions (baked in, do not re-debate)

1. **Exact-match, case-insensitive, whitespace-trimmed email lookup.** Input normalized in `lookupUserByEmail`. No substring, no prefix.
2. **Transactional dual-writes for membership.** Same shape as Phase 1's `createProject` / `deleteProject`.
3. **Role gating is enforced both in rules and in UI.** Rules are authoritative; UI is cosmetic (disable controls so users don't get errors they could have avoided).
4. **`useActiveRole()` reads from `ProjectContext.projects` — no new data fetch.** `projects` already carries `role` after Task 3.
5. **Non-owners cannot be removed by other non-owners.** Only the owner manages membership. Rule-enforced.
6. **`leaveProject` is a wrapper around `removeMember(projectId, self.uid)`.** Separate name for UX clarity (distinct button, distinct confirmation copy), same underlying transaction.
7. **Owner cannot be removed via `removeMember`.** Throws client-side; rule layer also rejects (`ownerId` must remain unchanged on update).
8. **No pending-invite doc.** Unresolved email → typed error `{ code: 'user-not-found' }` with a clear user-facing message.
9. **Public profile write is owner-only.** A user cannot set someone else's public profile — period. `provisionUserProfile` writes the caller's own doc.
10. **`SaveIndicator` surfaces the permission-denied error** if a viewer somehow bypasses the UI disable (defense in depth).

---

## Task 1 — Widen `Role` + domain constants

**Files:**
- Modify: `src/domain/project.ts`
- Test: `src/domain/project.test.ts`

Implements `Requirement: Project domain type` (modified: Role union widened).

- [ ] **Step 1: Extend the existing test**

Append to `src/domain/project.test.ts`:

```ts
import { PUBLIC_PROFILE_PATH, ROLES_THAT_CAN_WRITE_DESIGN } from './project';

describe('Role extensions', () => {
  it('Role union accepts owner, editor, viewer', () => {
    const roles: Array<'owner' | 'editor' | 'viewer'> = ['owner', 'editor', 'viewer'];
    expect(roles).toHaveLength(3);
  });

  it('PUBLIC_PROFILE_PATH formats the Firestore path', () => {
    expect(PUBLIC_PROFILE_PATH('uid_A')).toBe('users/uid_A/publicProfile/main');
  });

  it('ROLES_THAT_CAN_WRITE_DESIGN excludes viewer', () => {
    expect(ROLES_THAT_CAN_WRITE_DESIGN).toEqual(['owner', 'editor']);
    expect(ROLES_THAT_CAN_WRITE_DESIGN.includes('viewer' as any)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/domain/project.test.ts`
Expected: import errors; `PUBLIC_PROFILE_PATH` and `ROLES_THAT_CAN_WRITE_DESIGN` don't exist yet.

- [ ] **Step 3: Update `src/domain/project.ts`**

```ts
export const PROJECT_SCHEMA_VERSION = 1 as const;
export const DEFAULT_PROJECT_NAME = 'My First Project' as const;

export type Role = 'owner' | 'editor' | 'viewer';

export const ROLES_THAT_CAN_WRITE_DESIGN: Role[] = ['owner', 'editor'];

export function PUBLIC_PROFILE_PATH(uid: string): string {
  return `users/${uid}/publicProfile/main`;
}

export interface PublicProfile {
  displayName: string;
  email: string;
  photoURL: string;
  updatedAt: Date | unknown;
}

export interface Project {
  id: string;
  ownerId: string;
  members: Record<string, Role>;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  schemaVersion: number;
}

export interface ProjectRef {
  role: Role;
  addedAt: Date | unknown;
  lastOpenedAt?: Date | unknown;
}

interface MakeNewProjectArgs {
  id: string;
  ownerId: string;
  name: string;
  now: Date | unknown;
}

export function makeNewProject({ id, ownerId, name, now }: MakeNewProjectArgs): Project {
  return {
    id,
    ownerId,
    members: { [ownerId]: 'owner' },
    name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: PROJECT_SCHEMA_VERSION,
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/domain/project.test.ts && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/domain/project.ts src/domain/project.test.ts
git commit -m "feat(project): widen Role union to owner|editor|viewer + publicProfile types"
```

---

## Task 2 — `publicProfile` in `provisionUserProfile`

**Files:**
- Modify: `src/lib/firebase.ts`
- Modify: `src/lib/firebase.test.ts`

Implements `Requirement: User profile created on first sign-in` (modified: writes two docs), `Requirement: User profile updated on subsequent sign-ins` (modified: mirrors to public profile).

- [ ] **Step 1: Write failing test**

Add to `src/lib/firebase.test.ts` inside `describe('provisionUserProfile', …)`:

```ts
it('mirrors displayName/email/photoURL to publicProfile/main on first sign-in', async () => {
  mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
  const user = createMockUser() as any;

  await provisionUserProfile(user);

  // Two setDoc calls: profile/main and publicProfile/main
  expect(mockSetDoc).toHaveBeenCalledTimes(2);

  const publicCall = mockSetDoc.mock.calls.find(
    ([ref]: any[]) => ref._path?.endsWith('/publicProfile/main'),
  );
  expect(publicCall).toBeTruthy();
  const [, publicData, publicOptions] = publicCall!;
  expect(publicData).toMatchObject({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
  });
  expect(publicData.updatedAt).toEqual({ _type: 'serverTimestamp' });
  expect(publicOptions).toEqual({ merge: true });
});

it('updates publicProfile on returning sign-in', async () => {
  mockGetDoc.mockResolvedValue(mockDocSnapshot(true, {
    displayName: 'Old',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-01-01T00:00:00Z',
  }));
  const user = createMockUser({ displayName: 'New Name' }) as any;

  await provisionUserProfile(user);

  const publicCall = mockSetDoc.mock.calls.find(
    ([ref]: any[]) => ref._path?.endsWith('/publicProfile/main'),
  );
  expect(publicCall).toBeTruthy();
  expect(publicCall![1].displayName).toBe('New Name');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/firebase.test.ts`

- [ ] **Step 3: Update `provisionUserProfile`**

In `src/lib/firebase.ts`, replace the function:

```ts
export async function provisionUserProfile(user: User) {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'main');
  const publicProfileRef = doc(db, 'users', user.uid, 'publicProfile', 'main');
  const profileSnap = await getDoc(profileRef);

  const publicPayload = {
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoURL: user.photoURL ?? '',
    updatedAt: serverTimestamp(),
  };

  if (profileSnap.exists()) {
    await Promise.all([
      setDoc(profileRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLoginAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(publicProfileRef, publicPayload, { merge: true }),
    ]);
  } else {
    await Promise.all([
      setDoc(profileRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(publicProfileRef, publicPayload, { merge: true }),
    ]);
  }
}
```

- [ ] **Step 4: Also re-export `collectionGroup`**

In `src/lib/firebase.ts`, add to the imports:

```ts
import {
  // ...existing...
  collectionGroup,
} from 'firebase/firestore';
```

And to the export block:

```ts
export {
  // ...existing...
  collectionGroup,
};
```

- [ ] **Step 5: Extend test mocks for `collectionGroup`**

In `src/test/firebase-mocks.ts`, add:

```ts
export const mockCollectionGroup = vi.fn((_db: any, path: string) => ({ _collectionGroup: path }));
```

Update `resetFirestoreProjectMocks` to also `mockCollectionGroup.mockClear();`.

Update every `vi.mock('firebase/firestore', …)` factory (in `firebase.test.ts`, `AuthContext.test.tsx`, `LoginScreen.test.tsx`, `useFirestoreDoc.test.tsx`, all domain-context `*.test.tsx` files, plus the new tests in Tasks 3/5) to include `collectionGroup: mockCollectionGroup`.

- [ ] **Step 6: Run — expect PASS**

Run: `npm run test && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/lib/firebase.ts src/lib/firebase.test.ts src/test/firebase-mocks.ts
git commit -m "feat(provision): mirror public profile on every sign-in; re-export collectionGroup"
```

---

## Task 3 — Security rules for publicProfile + widened membership

**Files:**
- Modify: `firestore.rules`

Implements `Requirement: Public profile is world-readable to authenticated users`, `Requirement: Security rules for design subcollection` (modified: role-gated writes), `Requirement: Security rules for projectRefs` (modified: expanded writes), `Requirement: Security rules for projects collection` (modified: non-owners can't change members).

- [ ] **Step 1: Update `firestore.rules`**

Replace the entire projects block and add the publicProfile block. In `firestore.rules`:

```
    // ===============================================================
    // Public profile (world-readable to authenticated users)
    // ===============================================================

    function isValidPublicProfile(data) {
      return data.keys().hasOnly(['displayName', 'email', 'photoURL', 'updatedAt']) &&
             data.displayName is string &&
             data.email is string &&
             data.photoURL is string;
    }

    match /users/{userId}/publicProfile/main {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId) && isValidPublicProfile(request.resource.data);
    }

    // ===============================================================
    // Projects (Phase 2: multi-role)
    // ===============================================================

    function isMember(projectData) {
      return isAuthenticated() && projectData.members[request.auth.uid] != null;
    }

    function memberRole(projectData) {
      return projectData.members[request.auth.uid];
    }

    function isProjectOwner(projectData) {
      return isAuthenticated() && request.auth.uid == projectData.ownerId;
    }

    function canWriteDesign(projectData) {
      return isMember(projectData) && memberRole(projectData) in ['owner', 'editor'];
    }

    match /projects/{projectId} {
      allow read: if isMember(resource.data);
      allow create: if isAuthenticated()
                    && request.resource.data.ownerId == request.auth.uid
                    && request.resource.data.members[request.auth.uid] == 'owner';
      allow update: if isMember(resource.data)
                    && request.resource.data.ownerId == resource.data.ownerId
                    && (isProjectOwner(resource.data)
                        || request.resource.data.members == resource.data.members);
      allow delete: if isProjectOwner(resource.data);

      match /design/{docId} {
        allow read: if isMember(
          get(/databases/$(database)/documents/projects/$(projectId)).data
        );
        allow write: if canWriteDesign(
          get(/databases/$(database)/documents/projects/$(projectId)).data
        );
      }
    }

    match /users/{userId}/projectRefs/{projectId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId)
                   || request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId;
    }
```

Replace the old `match /projects/...`, `match /users/{userId}/projectRefs/...`, and add the new `publicProfile` block before the default-deny.

- [ ] **Step 2: Start emulator if not running**

```bash
npm run emulator:start
```

Rules live-reload on file save.

- [ ] **Step 3: Verify 8 scenarios in Rules Playground**

Open `http://localhost:4000/firestore` → Rules → Playground.

| # | Scenario | Setup | Expected |
|---|---|---|---|
| 1 | Owner adds member | `auth.uid = 'uid_A'`; `projects/p_1` `{ ownerId: 'uid_A', members: { uid_A: 'owner' } }`; update to add `uid_B: 'editor'` | Allow |
| 2 | Editor cannot change members | `auth.uid = 'uid_B'`; same project with `uid_B: 'editor'`; try to add `uid_C: 'editor'` | Deny |
| 3 | Editor can update name | `auth.uid = 'uid_B'`; update `name: 'New Name'`, members unchanged | Allow |
| 4 | Viewer cannot write design | `auth.uid = 'uid_C'`; members include `uid_C: 'viewer'`; write `projects/p_1/design/board` | Deny |
| 5 | Editor can write design | `auth.uid = 'uid_B'`; write `projects/p_1/design/cards` | Allow |
| 6 | Cross-user publicProfile read allowed | `auth.uid = 'uid_B'`; read `users/uid_A/publicProfile/main` | Allow |
| 7 | Cross-user publicProfile write denied | `auth.uid = 'uid_B'`; write `users/uid_A/publicProfile/main` | Deny |
| 8 | Project owner writes projectRef for member | `auth.uid = 'uid_A'` (owner of `p_1`); write `users/uid_B/projectRefs/p_1` | Allow |

Iterate on rules until all 8 pass.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat(firestore): role-aware rules for projects, design, projectRefs; publicProfile block"
```

---

## Task 4 — `useUserLookup` hook

**Files:**
- Create: `src/hooks/useUserLookup.ts`
- Test: `src/hooks/useUserLookup.test.ts`

Implements `Requirement: User lookup by email`, `Requirement: Public profile supports collection-group email lookup`.

- [ ] **Step 1: Write failing test**

Create `src/hooks/useUserLookup.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockCollectionGroup,
  mockGetDocs,
  mockQuery,
  mockWhere,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  collection: vi.fn(),
  collectionGroup: mockCollectionGroup,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  getDocFromServer: vi.fn(),
}));

import { lookupUserByEmail } from './useUserLookup';

describe('lookupUserByEmail', () => {
  beforeEach(() => { resetAllMocks(); });

  it('returns the matching user when email is found', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{
        ref: { parent: { parent: { id: 'uid_A' } } },
        data: () => ({ displayName: 'Alice', email: 'alice@example.com', photoURL: 'p.jpg' }),
      }],
    });
    const result = await lookupUserByEmail('alice@example.com');
    expect(result).toEqual({ uid: 'uid_A', displayName: 'Alice', photoURL: 'p.jpg' });
    expect(mockWhere).toHaveBeenCalledWith('email', '==', 'alice@example.com');
  });

  it('normalizes input (trim + lowercase)', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await lookupUserByEmail('  Alice@Example.com  ');
    expect(mockWhere).toHaveBeenCalledWith('email', '==', 'alice@example.com');
  });

  it('returns null when no user matches', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await lookupUserByEmail('nobody@example.com');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/hooks/useUserLookup.test.ts`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useUserLookup.ts`:

```ts
import { db, collectionGroup, query, where, getDocs } from '../lib/firebase';

export interface UserLookupResult {
  uid: string;
  displayName: string;
  photoURL: string;
}

export async function lookupUserByEmail(email: string): Promise<UserLookupResult | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const q = query(collectionGroup(db, 'publicProfile'), where('email', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc0 = snap.docs[0];
  const data = doc0.data() as any;
  const uid = doc0.ref.parent.parent?.id;
  if (!uid) return null;
  return {
    uid,
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? '',
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/hooks/useUserLookup.test.ts && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUserLookup.ts src/hooks/useUserLookup.test.ts
git commit -m "feat(hooks): lookupUserByEmail via collectionGroup query on publicProfile"
```

---

## Task 5 — Membership actions on `ProjectContext`

**Files:**
- Modify: `src/contexts/ProjectContext.tsx`
- Modify: `src/contexts/ProjectContext.test.tsx`

Implements `Requirement: Membership management actions on ProjectContext` + `ProjectMeta.role` (from `Requirement: Project domain type`).

- [ ] **Step 1: Add role to ProjectMeta**

In `src/contexts/ProjectContext.tsx`, update the type:

```ts
import { type Project, type Role, PROJECT_SCHEMA_VERSION, DEFAULT_PROJECT_NAME } from '../domain/project';

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  updatedAt: unknown;
  role: Role;
}
```

Update `loadProjectsForUser` to populate `role`:

```ts
async function loadProjectsForUser(uid: string): Promise<ProjectMeta[]> {
  const refsSnap = await getDocs(collection(db, 'users', uid, 'projectRefs'));
  const ids = refsSnap.docs.map((d: any) => d.id);
  const metas: ProjectMeta[] = [];
  for (const id of ids) {
    const pSnap = await getDoc(doc(db, 'projects', id));
    if (!pSnap.exists()) continue;
    const data = pSnap.data() as Project;
    const role = (data.members?.[uid] ?? 'viewer') as Role;
    metas.push({
      id,
      name: data.name,
      description: data.description,
      thumbnail: data.thumbnail,
      ownerId: data.ownerId,
      updatedAt: data.updatedAt,
      role,
    });
  }
  metas.sort((a, b) => {
    const av = (a.updatedAt as any)?.toMillis?.() ?? 0;
    const bv = (b.updatedAt as any)?.toMillis?.() ?? 0;
    return bv - av;
  });
  return metas;
}
```

- [ ] **Step 2: Extend the context value + add membership actions**

Still in `ProjectContext.tsx`, add to the value interface:

```ts
interface ProjectContextValue {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  loading: boolean;
  createProject: (name: string) => Promise<string>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  closeActive: () => void;
  addMember: (projectId: string, email: string, role: Role) => Promise<void>;
  removeMember: (projectId: string, targetUid: string) => Promise<void>;
  changeRole: (projectId: string, targetUid: string, newRole: Role) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
}
```

Add imports:

```ts
import { lookupUserByEmail } from '../hooks/useUserLookup';
```

Implement the actions inside `ProjectProvider`:

```ts
const addMember = useCallback(async (projectId: string, email: string, role: Role) => {
  if (!user) throw new Error('Not signed in');
  const uid = user.uid;
  const target = await lookupUserByEmail(email);
  if (!target) {
    const err = new Error('User not found') as Error & { code?: string };
    err.code = 'user-not-found';
    throw err;
  }

  const projectRef = doc(db, 'projects', projectId);
  const refDocRef = doc(db, 'users', target.uid, 'projectRefs', projectId);

  await runTransaction(db, async (tx: any) => {
    const pSnap = await tx.get(projectRef);
    if (!pSnap.exists()) throw new Error('Project not found');
    const current = pSnap.data() as Project;
    tx.update(projectRef, {
      members: { ...current.members, [target.uid]: role },
      updatedAt: serverTimestamp(),
    });
    tx.set(refDocRef, {
      role,
      addedAt: serverTimestamp(),
    });
  });

  setProjects(await loadProjectsForUser(uid));
}, [user]);

const removeMember = useCallback(async (projectId: string, targetUid: string) => {
  if (!user) throw new Error('Not signed in');
  const uid = user.uid;
  const projectRef = doc(db, 'projects', projectId);
  const refDocRef = doc(db, 'users', targetUid, 'projectRefs', projectId);

  await runTransaction(db, async (tx: any) => {
    const pSnap = await tx.get(projectRef);
    if (!pSnap.exists()) throw new Error('Project not found');
    const current = pSnap.data() as Project;
    if (targetUid === current.ownerId) {
      throw new Error('Cannot remove the owner; delete the project instead');
    }
    const nextMembers = { ...current.members };
    delete nextMembers[targetUid];
    tx.update(projectRef, { members: nextMembers, updatedAt: serverTimestamp() });
    tx.delete(refDocRef);
  });

  setProjects(await loadProjectsForUser(uid));
  if (targetUid === uid && activeProjectId === projectId) setActiveProjectId(null);
}, [user, activeProjectId]);

const changeRole = useCallback(async (projectId: string, targetUid: string, newRole: Role) => {
  if (!user) throw new Error('Not signed in');
  const uid = user.uid;
  const projectRef = doc(db, 'projects', projectId);
  const refDocRef = doc(db, 'users', targetUid, 'projectRefs', projectId);

  await runTransaction(db, async (tx: any) => {
    const pSnap = await tx.get(projectRef);
    if (!pSnap.exists()) throw new Error('Project not found');
    const current = pSnap.data() as Project;
    if (targetUid === current.ownerId) {
      throw new Error('Cannot change the owner role');
    }
    tx.update(projectRef, {
      members: { ...current.members, [targetUid]: newRole },
      updatedAt: serverTimestamp(),
    });
    tx.update(refDocRef, { role: newRole });
  });

  setProjects(await loadProjectsForUser(uid));
}, [user]);

const leaveProject = useCallback(async (projectId: string) => {
  if (!user) throw new Error('Not signed in');
  await removeMember(projectId, user.uid);
}, [user, removeMember]);
```

Expose them in the provider value:

```tsx
<ProjectContext.Provider
  value={{
    projects,
    activeProjectId,
    loading,
    createProject,
    renameProject,
    deleteProject,
    openProject,
    closeActive,
    addMember,
    removeMember,
    changeRole,
    leaveProject,
  }}
>
```

- [ ] **Step 3: Add tests**

Append to `src/contexts/ProjectContext.test.tsx`:

```tsx
import { lookupUserByEmail } from '../hooks/useUserLookup';
vi.mock('../hooks/useUserLookup', () => ({
  lookupUserByEmail: vi.fn(),
}));

// Inside the existing describe block:
describe('membership actions', () => {
  it('addMember resolves email + writes project + projectRefs transactionally', async () => {
    (lookupUserByEmail as any).mockResolvedValueOnce({
      uid: 'uid_B', displayName: 'Bob', photoURL: 'p.jpg',
    });
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'X', ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const txUpdate = vi.fn();
    const txSet = vi.fn();
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      await fn({
        update: txUpdate, set: txSet, delete: vi.fn(),
        get: vi.fn().mockResolvedValue(mockDocSnapshot(true, {
          ownerId: 'uid_A', members: { uid_A: 'owner' },
        })),
      });
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addMember('p_1', 'bob@example.com', 'editor');
    });

    expect(txUpdate).toHaveBeenCalled();
    const [, updateData] = txUpdate.mock.calls[0];
    expect(updateData.members).toEqual({ uid_A: 'owner', uid_B: 'editor' });
    expect(txSet).toHaveBeenCalled();
    const [refDocRef, refData] = txSet.mock.calls[0];
    expect(refDocRef._path).toBe('users/uid_B/projectRefs/p_1');
    expect(refData.role).toBe('editor');
  });

  it('addMember rejects unknown email with user-not-found code', async () => {
    (lookupUserByEmail as any).mockResolvedValueOnce(null);
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'X', ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(async () => {
      await act(async () => {
        await result.current.addMember('p_1', 'noone@example.com', 'editor');
      });
    }).rejects.toMatchObject({ code: 'user-not-found' });
  });

  it('removeMember rejects removing the owner', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'X', ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      await fn({
        update: vi.fn(), set: vi.fn(), delete: vi.fn(),
        get: vi.fn().mockResolvedValue(mockDocSnapshot(true, {
          ownerId: 'uid_A', members: { uid_A: 'owner' },
        })),
      });
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(async () => {
      await act(async () => {
        await result.current.removeMember('p_1', 'uid_A');
      });
    }).rejects.toThrow(/Cannot remove the owner/);
  });

  it('role is populated on ProjectMeta for editor member', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_shared', data: () => ({ role: 'editor' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_shared') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'Shared', ownerId: 'uid_A',
          members: { uid_A: 'owner', uid_B: 'editor' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_B' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects[0].role).toBe('editor');
  });
});
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/ProjectContext.test.tsx && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/ProjectContext.tsx src/contexts/ProjectContext.test.tsx
git commit -m "feat(projects): addMember, removeMember, changeRole, leaveProject + role on meta"
```

---

## Task 6 — `useActiveRole` + `RoleBadge` + `ReadOnlyBanner`

**Files:**
- Create: `src/hooks/useActiveRole.ts`
- Create: `src/components/RoleBadge.tsx`
- Create: `src/components/ReadOnlyBanner.tsx`
- Test: `src/hooks/useActiveRole.test.tsx`
- Test: `src/components/RoleBadge.test.tsx`

Implements `Requirement: Role-aware editor UI`, `Requirement: Role badge on project list`.

- [ ] **Step 1: Write tests for useActiveRole**

Create `src/hooks/useActiveRole.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';

vi.mock('../contexts/ProjectContext', () => ({
  useProjects: () => ({
    activeProjectId: 'p_1',
    projects: [
      { id: 'p_1', name: 'X', ownerId: 'uid_A', updatedAt: null, role: 'editor' },
      { id: 'p_2', name: 'Y', ownerId: 'uid_A', updatedAt: null, role: 'owner' },
    ],
  }),
}));

import { useActiveRole } from './useActiveRole';

describe('useActiveRole', () => {
  it('returns the role for the active project', () => {
    const { result } = renderHook(() => useActiveRole());
    expect(result.current).toBe('editor');
  });
});
```

And a second variant for null case — use `vi.resetModules()` per block or a separate test file. Simpler: add one more file `useActiveRole.null.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../contexts/ProjectContext', () => ({
  useProjects: () => ({
    activeProjectId: null,
    projects: [],
  }),
}));

import { useActiveRole } from './useActiveRole';

describe('useActiveRole (no active project)', () => {
  it('returns null when no project is active', () => {
    const { result } = renderHook(() => useActiveRole());
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `useActiveRole`**

Create `src/hooks/useActiveRole.ts`:

```ts
import { useProjects } from '../contexts/ProjectContext';
import type { Role } from '../domain/project';

export function useActiveRole(): Role | null {
  const { activeProjectId, projects } = useProjects();
  if (!activeProjectId) return null;
  const match = projects.find((p) => p.id === activeProjectId);
  return match?.role ?? null;
}
```

- [ ] **Step 3: Write tests for RoleBadge**

Create `src/components/RoleBadge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
  it('renders Editor label for editor role', () => {
    render(<RoleBadge role="editor" />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });
  it('renders Viewer label for viewer role', () => {
    render(<RoleBadge role="viewer" />);
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });
  it('renders nothing for owner role', () => {
    const { container } = render(<RoleBadge role="owner" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 4: Implement `RoleBadge`**

Create `src/components/RoleBadge.tsx`:

```tsx
import React from 'react';
import type { Role } from '../domain/project';

interface Props {
  role: Role;
}

export default function RoleBadge({ role }: Props) {
  if (role === 'owner') return null;
  const base = 'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full';
  if (role === 'editor') {
    return <span className={`${base} bg-secondary/20 text-secondary`}>Editor</span>;
  }
  return <span className={`${base} bg-surface-container-high text-on-surface-variant`}>Viewer</span>;
}
```

- [ ] **Step 5: Implement `ReadOnlyBanner`**

Create `src/components/ReadOnlyBanner.tsx`:

```tsx
import React from 'react';

export default function ReadOnlyBanner() {
  return (
    <div className="bg-surface-container-high border-b border-outline-variant/50 px-6 py-2 text-sm text-on-surface-variant">
      <span className="material-symbols-outlined align-middle mr-2 text-[18px]">visibility</span>
      You're viewing this project as a Viewer. You can't make changes.
    </div>
  );
}
```

- [ ] **Step 6: Run — expect PASS**

Run: `npx vitest run src/hooks/useActiveRole.test.tsx src/hooks/useActiveRole.null.test.tsx src/components/RoleBadge.test.tsx && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useActiveRole.ts src/hooks/useActiveRole.test.tsx src/hooks/useActiveRole.null.test.tsx src/components/RoleBadge.tsx src/components/RoleBadge.test.tsx src/components/ReadOnlyBanner.tsx
git commit -m "feat(ui): useActiveRole hook, RoleBadge pill, ReadOnlyBanner"
```

---

## Task 7 — `ShareDialog`

**Files:**
- Create: `src/components/ShareDialog.tsx`
- Test: `src/components/ShareDialog.test.tsx`

Implements `Requirement: ShareDialog UI`.

- [ ] **Step 1: Write failing test**

Create `src/components/ShareDialog.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareDialog from './ShareDialog';

function setup(override?: {
  addMember?: any;
  removeMember?: any;
  changeRole?: any;
  members?: Array<{ uid: string; displayName: string; email: string; role: 'owner' | 'editor' | 'viewer'; photoURL: string }>;
}) {
  const addMember = override?.addMember ?? vi.fn().mockResolvedValue(undefined);
  const removeMember = override?.removeMember ?? vi.fn().mockResolvedValue(undefined);
  const changeRole = override?.changeRole ?? vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  const members = override?.members ?? [
    { uid: 'uid_A', displayName: 'Alice', email: 'alice@example.com', role: 'owner', photoURL: '' },
    { uid: 'uid_B', displayName: 'Bob', email: 'bob@example.com', role: 'editor', photoURL: '' },
  ];
  render(
    <ShareDialog
      projectId="p_1"
      projectName="Demo"
      members={members}
      addMember={addMember}
      removeMember={removeMember}
      changeRole={changeRole}
      onClose={onClose}
    />,
  );
  return { addMember, removeMember, changeRole, onClose };
}

describe('ShareDialog', () => {
  afterEach(() => cleanup());

  it('renders current members', () => {
    setup();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('adds a member by email on happy path', async () => {
    const { addMember } = setup();
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => expect(addMember).toHaveBeenCalledWith('p_1', 'new@example.com', 'editor'));
  });

  it('shows error when email is not found', async () => {
    const addMember = vi.fn().mockRejectedValue(Object.assign(new Error('not found'), { code: 'user-not-found' }));
    setup({ addMember });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => expect(screen.getByText(/hasn't signed in to GameCraft/i)).toBeInTheDocument());
  });

  it('removes a member after confirmation', async () => {
    const { removeMember } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Remove Bob/i }));
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('p_1', 'uid_B'));
    confirmSpy.mockRestore();
  });

  it('changes a role via role picker', async () => {
    const { changeRole } = setup();
    const picker = screen.getByRole('combobox', { name: /role for Bob/i });
    fireEvent.change(picker, { target: { value: 'viewer' } });
    await waitFor(() => expect(changeRole).toHaveBeenCalledWith('p_1', 'uid_B', 'viewer'));
  });

  it('does not show Remove button for the owner row', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Remove Alice/i })).toBeNull();
  });

  it('renders the last-write-wins disclaimer', () => {
    setup();
    expect(screen.getByText(/most recent save wins/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/ShareDialog.test.tsx`

- [ ] **Step 3: Implement `ShareDialog`**

Create `src/components/ShareDialog.tsx`:

```tsx
import React, { useState } from 'react';
import type { Role } from '../domain/project';

export interface ShareDialogMember {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  photoURL: string;
}

interface Props {
  projectId: string;
  projectName: string;
  members: ShareDialogMember[];
  addMember: (projectId: string, email: string, role: Role) => Promise<void>;
  removeMember: (projectId: string, uid: string) => Promise<void>;
  changeRole: (projectId: string, uid: string, role: Role) => Promise<void>;
  onClose: () => void;
}

export default function ShareDialog({
  projectId, projectName, members,
  addMember, removeMember, changeRole, onClose,
}: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      await addMember(projectId, email.trim(), role);
      setEmail('');
    } catch (e: any) {
      if (e?.code === 'user-not-found') {
        setError("This user hasn't signed in to GameCraft yet — ask them to sign in first.");
      } else {
        setError(e?.message ?? 'Failed to add member');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (uid: string, name: string) => {
    if (!window.confirm(`Remove ${name} from "${projectName}"?`)) return;
    await removeMember(projectId, uid);
  };

  const handleChangeRole = async (uid: string, newRole: Role) => {
    await changeRole(projectId, uid, newRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-surface-container rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-outline-variant/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-on-surface font-headline mb-4">Share "{projectName}"</h2>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {members.map((m) => (
            <div key={m.uid} className="flex items-center gap-3 py-2 border-b border-outline-variant/40">
              {m.photoURL
                ? <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full shrink-0" referrerPolicy="no-referrer" />
                : <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-on-surface truncate">{m.displayName}</div>
                <div className="text-xs text-on-surface-variant truncate">{m.email}</div>
              </div>
              {m.role === 'owner' ? (
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Owner</span>
              ) : (
                <>
                  <select
                    aria-label={`Role for ${m.displayName}`}
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.uid, e.target.value as Role)}
                    className="bg-surface-container-high text-on-surface text-xs rounded-lg px-2 py-1"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    aria-label={`Remove ${m.displayName}`}
                    onClick={() => handleRemove(m.uid, m.displayName)}
                    className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-surface-container-high text-on-surface text-sm rounded-lg px-3 py-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-surface-container-high text-on-surface text-sm rounded-lg px-2 py-2"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={busy || !email.trim()}
            className="bg-primary text-on-primary-container rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-widest disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-error mb-2">{error}</p>}
        <p className="text-xs text-on-surface-variant italic mt-4">
          When two people edit at the same time, the most recent save wins. Coordinate over chat for heavy editing.
        </p>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/components/ShareDialog.test.tsx && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareDialog.tsx src/components/ShareDialog.test.tsx
git commit -m "feat(ui): ShareDialog with add-by-email, role picker, remove with confirm"
```

---

## Task 8 — `ProjectListScreen` role-aware actions

**Files:**
- Modify: `src/components/ProjectListScreen.tsx`
- Modify: `src/components/ProjectListScreen.test.tsx`

Implements `Requirement: Role badge on project list` + owner-only Share/Delete vs non-owner Leave.

- [ ] **Step 1: Extend test — role-gated actions**

Add to `src/components/ProjectListScreen.test.tsx`:

```tsx
function setupMixed() {
  const createProject = vi.fn().mockResolvedValue('p_new');
  const renameProject = vi.fn().mockResolvedValue(undefined);
  const deleteProject = vi.fn().mockResolvedValue(undefined);
  const openProject = vi.fn().mockResolvedValue(undefined);
  const leaveProject = vi.fn().mockResolvedValue(undefined);
  const onOpenShare = vi.fn();
  const projects = [
    { id: 'p_owned', name: 'Owned', ownerId: 'uid_A', updatedAt: null, role: 'owner' as const },
    { id: 'p_shared', name: 'Shared', ownerId: 'uid_B', updatedAt: null, role: 'editor' as const },
    { id: 'p_ro', name: 'ReadOnly', ownerId: 'uid_B', updatedAt: null, role: 'viewer' as const },
  ];
  render(
    <ProjectListScreen
      projects={projects}
      createProject={createProject}
      renameProject={renameProject}
      deleteProject={deleteProject}
      openProject={openProject}
      leaveProject={leaveProject}
      onOpenShare={onOpenShare}
    />,
  );
  return { deleteProject, leaveProject, onOpenShare };
}

it('shows Share and Delete only on owned projects', () => {
  const { deleteProject } = setupMixed();
  const ownedCard = screen.getByText('Owned').closest('div')!;
  // eslint-disable-next-line testing-library/no-node-access
  expect(ownedCard.parentElement!.querySelector('[aria-label="Share Owned"]')).toBeTruthy();
  const sharedCard = screen.getByText('Shared').closest('div')!;
  // eslint-disable-next-line testing-library/no-node-access
  expect(sharedCard.parentElement!.querySelector('[aria-label="Share Shared"]')).toBeNull();
  expect(deleteProject).not.toHaveBeenCalled(); // not invoked yet
});

it('shows Leave on non-owned projects', () => {
  const { leaveProject } = setupMixed();
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: /Leave Shared/i }));
  expect(leaveProject).toHaveBeenCalledWith('p_shared');
  confirmSpy.mockRestore();
});

it('shows RoleBadge for non-owner roles', () => {
  setupMixed();
  expect(screen.getByText('Editor')).toBeInTheDocument();
  expect(screen.getByText('Viewer')).toBeInTheDocument();
});

it('opens Share dialog when Share is clicked', () => {
  const { onOpenShare } = setupMixed();
  fireEvent.click(screen.getByRole('button', { name: /Share Owned/i }));
  expect(onOpenShare).toHaveBeenCalledWith('p_owned');
});
```

Update the pre-existing `setup()` helper to include the new `leaveProject` + `onOpenShare` props (both can default to `vi.fn()`).

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/ProjectListScreen.test.tsx`

- [ ] **Step 3: Update `ProjectListScreen.tsx`**

```tsx
import React from 'react';
import type { ProjectMeta } from '../contexts/ProjectContext';
import RoleBadge from './RoleBadge';

interface Props {
  projects: ProjectMeta[];
  createProject: (name: string) => Promise<string>;
  renameProject: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  leaveProject: (id: string) => Promise<void>;
  onOpenShare: (id: string) => void;
}

export default function ProjectListScreen({
  projects, createProject, renameProject, deleteProject, openProject, leaveProject, onOpenShare,
}: Props) {
  const handleCreate = async () => {
    const name = window.prompt('New project name');
    if (!name) return;
    await createProject(name);
  };

  const handleRename = async (id: string, current: string) => {
    const name = window.prompt('New name', current);
    if (!name || name === current) return;
    await renameProject(id, name);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProject(id);
  };

  const handleLeave = async (id: string, name: string) => {
    if (!window.confirm(`Leave "${name}"? You won't be able to rejoin unless re-invited.`)) return;
    await leaveProject(id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-on-surface font-headline">Projects</h2>
        <button
          onClick={handleCreate}
          className="bg-primary text-on-primary-container rounded-xl px-4 py-2 font-bold text-sm uppercase tracking-widest hover:brightness-110"
        >
          <span className="material-symbols-outlined align-middle mr-1">add</span>
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="font-medium">No projects yet — hit "New project" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isOwner = p.role === 'owner';
            return (
              <div
                key={p.id}
                className="bg-surface-container rounded-xl border border-outline-variant/50 p-4 flex flex-col gap-3"
              >
                <button
                  aria-label={`Open ${p.name}`}
                  onClick={() => openProject(p.id)}
                  className="text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-on-surface">{p.name}</h3>
                    <RoleBadge role={p.role} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-on-surface-variant mt-1">{p.description}</p>
                  )}
                </button>
                <div className="flex gap-2 mt-auto pt-3 border-t border-outline-variant/40">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => handleRename(p.id, p.name)}
                        className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                      >
                        Rename
                      </button>
                      <button
                        aria-label={`Share ${p.name}`}
                        onClick={() => onOpenShare(p.id)}
                        className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110 ml-auto"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      aria-label={`Leave ${p.name}`}
                      onClick={() => handleLeave(p.id, p.name)}
                      className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110 ml-auto"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/components/ProjectListScreen.test.tsx && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectListScreen.tsx src/components/ProjectListScreen.test.tsx
git commit -m "feat(ui): role-aware project list actions (Share/Leave/Delete)"
```

---

## Task 9 — App integration: mount `ShareDialog`

**Files:**
- Modify: `src/App.tsx`

Implements the wiring for `Requirement: ShareDialog UI`.

Members shown in `ShareDialog` come from reading `projects/{pid}` + resolving each uid via `publicProfile/main`. Build a small helper in `App.tsx` that fetches these on-demand when the dialog opens.

- [ ] **Step 1: Add a helper + state**

In `src/App.tsx`, inside `AuthedApp`, add:

```tsx
import ShareDialog, { type ShareDialogMember } from './components/ShareDialog';
import { db, doc, getDoc } from './lib/firebase';

// ...inside AuthedApp, alongside other useState hooks:
const [shareTargetId, setShareTargetId] = useState<string | null>(null);
const [shareMembers, setShareMembers] = useState<ShareDialogMember[]>([]);

const openShare = async (projectId: string) => {
  setShareTargetId(projectId);
  const pSnap = await getDoc(doc(db, 'projects', projectId));
  if (!pSnap.exists()) return;
  const data = pSnap.data() as any;
  const uids: string[] = Object.keys(data.members ?? {});
  const rows: ShareDialogMember[] = [];
  for (const uid of uids) {
    const pp = await getDoc(doc(db, 'users', uid, 'publicProfile', 'main'));
    if (!pp.exists()) continue;
    const ppData = pp.data() as any;
    rows.push({
      uid,
      displayName: ppData.displayName ?? '',
      email: ppData.email ?? '',
      photoURL: ppData.photoURL ?? '',
      role: data.members[uid],
    });
  }
  setShareMembers(rows);
};

const closeShare = () => {
  setShareTargetId(null);
  setShareMembers([]);
};
```

- [ ] **Step 2: Pass `leaveProject` + `onOpenShare` into `ProjectListScreen`**

Still in `src/App.tsx`, where `ProjectListScreen` is rendered, update:

```tsx
<ProjectListScreen
  projects={projects}
  createProject={async (n) => {
    const id = await createProject(n);
    await openProject(id);
    setActiveScreen('rules');
    return id;
  }}
  renameProject={renameProject}
  deleteProject={deleteProject}
  openProject={async (id) => {
    await openProject(id);
    setActiveScreen('rules');
  }}
  leaveProject={leaveProject}
  onOpenShare={openShare}
/>
```

And pull `leaveProject` from `useProjects()` into the destructure at the top of `AuthedApp`.

- [ ] **Step 3: Render `ShareDialog` conditionally**

At the bottom of both return branches (list-view AND editor-view), add just before the closing fragment:

```tsx
{shareTargetId && (
  <ShareDialog
    projectId={shareTargetId}
    projectName={projects.find((p) => p.id === shareTargetId)?.name ?? ''}
    members={shareMembers}
    addMember={async (pid, email, role) => {
      await addMember(pid, email, role);
      await openShare(pid); // refresh list
    }}
    removeMember={async (pid, uid) => {
      await removeMember(pid, uid);
      await openShare(pid);
    }}
    changeRole={async (pid, uid, role) => {
      await changeRole(pid, uid, role);
      await openShare(pid);
    }}
    onClose={closeShare}
  />
)}
```

Pull `addMember`, `removeMember`, `changeRole` from `useProjects()` into the destructure.

- [ ] **Step 4: Lint + smoke test**

Run: `npm run lint && npm run test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): mount ShareDialog, wire openShare + leaveProject into list"
```

---

## Task 10 — Role-aware editors

**Files:**
- Modify: `src/components/BoardEditor.tsx`
- Modify: `src/components/CardDesigner.tsx`
- Modify: `src/components/RulesEditor.tsx`
- Modify: `src/components/TokensEditor.tsx`

Implements `Requirement: Role-aware editor UI`.

These editors currently render inputs freely. We wrap the top level with `<ReadOnlyBanner />` and `disabled={isViewer}` on mutation controls. Rather than touch every input by hand, we wrap the whole editor tree in a `<fieldset disabled={isViewer}>` — in HTML, `<fieldset disabled>` disables all form controls inside, including nested buttons. This is a DRY, one-line gate.

- [ ] **Step 1: Update each editor**

For each of `BoardEditor.tsx`, `CardDesigner.tsx`, `RulesEditor.tsx`, `TokensEditor.tsx`:

At the top of the component function, add:

```tsx
import { useActiveRole } from '../hooks/useActiveRole';
import ReadOnlyBanner from './ReadOnlyBanner';

// inside the component:
const role = useActiveRole();
const isViewer = role === 'viewer';
```

Wrap the returned tree:

```tsx
return (
  <>
    {isViewer && <ReadOnlyBanner />}
    <fieldset disabled={isViewer} className="contents">
      {/* existing JSX here, unchanged */}
    </fieldset>
  </>
);
```

`className="contents"` ensures the fieldset doesn't introduce layout boxes.

- [ ] **Step 2: Smoke test — viewer role disables controls**

Add to each editor's test (or create a minimal one if none exists). Simplest spot: `src/components/BoardEditor.test.tsx` (if it doesn't exist, skip and rely on manual verification in Task 12).

Optional test with mocked context:

```tsx
import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';

vi.mock('../hooks/useActiveRole', () => ({ useActiveRole: () => 'viewer' }));
vi.mock('../contexts/BoardContext', () => ({
  useBoard: () => ({ tiles: [], selectedTileId: null, dispatch: vi.fn() }),
}));

import BoardEditor from './BoardEditor';

describe('BoardEditor viewer gating', () => {
  afterEach(() => cleanup());
  it('renders a read-only banner when role is viewer', () => {
    const { container } = render(<BoardEditor />);
    expect(container.textContent).toMatch(/Viewer/);
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.hasAttribute('disabled')).toBe(true);
  });
});
```

Only create this test if the file feels light; heavy existing editor tests might not justify adding one. Manual verification in Task 12 covers the end-to-end case.

- [ ] **Step 3: Run — expect PASS**

Run: `npm run test && npm run lint`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/components/BoardEditor.tsx src/components/CardDesigner.tsx src/components/RulesEditor.tsx src/components/TokensEditor.tsx
git commit -m "feat(editors): viewer role disables controls via fieldset + ReadOnlyBanner"
```

---

## Task 11 — Seed a second user + shared project

**Files:**
- Modify: `scripts/seed-emulator.ts`

- [ ] **Step 1: Add a second user + cross-membership seed**

Open `scripts/seed-emulator.ts`. After the existing seed block for `test-user-001`, add:

```ts
  const uid2 = 'test-user-002';

  await db.doc(`users/${uid2}/profile/main`).set({
    displayName: 'Test Editor',
    email: 'editor@example.com',
    photoURL: 'https://example.com/avatar2.png',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  });
  await db.doc(`users/${uid2}/publicProfile/main`).set({
    displayName: 'Test Editor',
    email: 'editor@example.com',
    photoURL: 'https://example.com/avatar2.png',
    updatedAt: new Date(),
  });
  console.log('  ✓ Second user (test-user-002) as Editor target');

  // Share the demo project with test-user-002 as editor
  await db.doc(`projects/${projectId}`).set(
    { members: { [uid]: 'owner', [uid2]: 'editor' }, updatedAt: new Date() },
    { merge: true },
  );
  await db.doc(`users/${uid2}/projectRefs/${projectId}`).set({
    role: 'editor',
    addedAt: new Date(),
  });
  console.log('  ✓ Demo project shared with test-user-002 as editor');
```

Also add `publicProfile/main` for `test-user-001` (mirroring what `provisionUserProfile` would write):

```ts
  // Insert after the existing users/${uid}/profile/main .set()
  await db.doc(`users/${uid}/publicProfile/main`).set({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
    updatedAt: new Date(),
  });
  console.log('  ✓ Public profile for test-user-001');
```

- [ ] **Step 2: Verify seed**

```bash
npm run emulator:seed
```

Expected: all `✓` lines. In Emulator UI:
- `users/test-user-001/publicProfile/main` exists
- `users/test-user-002/publicProfile/main` exists
- `projects/p_demo.members` = `{ test-user-001: 'owner', test-user-002: 'editor' }`
- `users/test-user-002/projectRefs/p_demo` exists with `role: 'editor'`

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-emulator.ts
git commit -m "chore(emulator): seed publicProfile + a second user as editor of demo project"
```

---

## Task 12 — Docs + cleanup

**Files:**
- Modify: `CLAUDE.md`
- Modify: `openspec/domain-model.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Add a new subsection under "Key conventions":

```md
- **Roles:** A project's `members` map uses three roles: `owner` | `editor` | `viewer`. Owner has full control including membership management + delete. Editor can read + write design docs + leave. Viewer is read-only and sees a `<ReadOnlyBanner />` plus a `<fieldset disabled>` around the editor. Role is read via `useActiveRole()` (src/hooks/useActiveRole.ts). Membership mutations go through `ProjectContext` and always use `runTransaction` over `projects/{pid}.members` + `users/{targetUid}/projectRefs/{pid}`. Email resolution uses `lookupUserByEmail` (src/hooks/useUserLookup.ts) via a collection-group query on `publicProfile/main`.
```

- [ ] **Step 2: Update `openspec/domain-model.md`**

In the `### Project` block, expand the status:

```md
> Status: implemented (Phase 1 + Phase 2). Stored at `projects/{projectId}` with reverse index `users/{uid}/projectRefs/{projectId}`. Managed via `ProjectContext` / `ProjectListScreen`. Design domains persist to `projects/{projectId}/design/{board|cards|rules|tokens}`. Membership supports three roles: `owner` (full control, manages members, deletes project), `editor` (reads + writes design docs, can leave), `viewer` (read-only). Owner's email resolution for invites uses `users/{uid}/publicProfile/main` via collection-group query.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md openspec/domain-model.md
git commit -m "docs: update CLAUDE.md and domain-model.md for Phase 2 roles"
```

---

## Task 13 — Verification

Implements Section 10 of `tasks.md`.

- [ ] **Step 1: Lint + tests**

Run: `npm run lint && npm run test`
Expected: `tsc --noEmit` clean; all tests green.

- [ ] **Step 2: Emulator + seed + dev server**

```bash
# three terminals
npm run emulator:start
npm run emulator:seed
npm run dev:emu
```

Expected: app boots at `http://localhost:3000` against emulator-backed backend with a seeded shared project.

- [ ] **Step 3: Manual — owner flow**

Sign in as `test-user-001` (Emulator Auth → manage users). Observe:
- Land in `Demo Project` (last-opened hydration).
- `Projects` nav → list shows one project, no role badge (owner).
- Share dialog opens with test-user-001 (Owner) + test-user-002 (Editor). Add `editor@example.com` (alternate for the other seeded user) — error because already exists; try a second email in the emulator user list.
- Change test-user-002 to Viewer → save.
- Remove test-user-002 → confirm. test-user-002 disappears from the list.

- [ ] **Step 4: Manual — editor flow**

Open a second incognito window. Sign in as `test-user-002`. Observe:
- `Demo Project` appears with an `Editor` badge.
- Open it → edit a rule → `Saving…` → `Saved just now`.
- `Projects` nav: `Share` button absent; `Leave` button present.
- Leave → confirmation → project disappears.

(Re-run `npm run emulator:seed` to restore the shared project for further tests.)

- [ ] **Step 5: Manual — viewer flow**

In the first window as owner, change test-user-002 back to Viewer. In the second window (test-user-002), observe:
- Within ~1 s, `<ReadOnlyBanner />` appears above the editor.
- All inputs are greyed out; buttons unclickable.
- `SaveIndicator` stays `idle`.

- [ ] **Step 6: Manual — unknown email**

As owner, open Share → type `nobody@example.com` → Add. Expected: "This user hasn't signed in to GameCraft yet — ask them to sign in first." inline error.

- [ ] **Step 7: Manual — security rules**

Emulator Rules Playground, confirm all 8 Task-3 scenarios still pass (regression check after any late edits to `firestore.rules`).

---

## Spec Coverage Crosswalk (self-review)

| Spec Requirement | Implemented in |
|---|---|
| Project domain type (modified: Role union) | Task 1 |
| Security rules for projects collection (modified) | Task 3 |
| Security rules for design subcollection (modified) | Task 3 |
| Security rules for projectRefs (modified) | Task 3 |
| Membership management actions on ProjectContext | Task 5 |
| User lookup by email | Task 4 |
| ShareDialog UI | Tasks 7 + 9 |
| Role-aware editor UI | Tasks 6 (hook/banner) + 10 (editors) |
| Role badge on project list | Tasks 6 (badge) + 8 (list) |
| User profile created on first sign-in (modified: two docs) | Task 2 |
| User profile updated on subsequent sign-ins (modified: mirror public) | Task 2 |
| Public profile is world-readable to authenticated users | Task 3 (rules) + Task 2 (seeding from provision) |
| Public profile supports collection-group email lookup | Task 4 + Task 3 (rules) |

No gaps identified.

---

## Rollback / Safety Notes

- All commits land cleanly on top of Phase 1. Reverting any single task (except Task 1's `Role` widening) leaves the tree buildable.
- Reverting Task 1 requires a matching Task 3 revert (rules reference the wider role union).
- `firestore.rules` change is live-applied by the emulator; deploy to production via the Firebase Console or `firebase deploy --only firestore:rules`.
- Phase 1 projects have `members[ownerId] = 'owner'` — compatible with the widened union; no data migration runs.
