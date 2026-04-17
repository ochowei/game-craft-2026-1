# Project Aggregate Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `Project` as a first-class aggregate and migrate Board / Cards / Rules / Tokens persistence from localStorage to Firestore, enabling multi-project editing end-to-end.

**Architecture:** A top-level `projects/{projectId}` Firestore collection (with `ownerId` + `members` map) plus a per-user reverse index at `users/{uid}/projectRefs/{pid}` (dual-written via `runTransaction`). A single shared `useFirestoreDoc<T>` hook gives every design domain offline persistence, 500 ms debounced writes, and `onSnapshot` last-write-wins sync. Four design docs live at `projects/{pid}/design/{board|cards|rules|tokens}` so each domain keeps its own 1 MB budget and write boundary. Switching projects remounts the design provider subtree via `<ActiveProjectRoot key={activeProjectId}>` — the open-file UX. Library stays on localStorage (out of scope).

**Tech Stack:** React 19, TypeScript, Firebase 12 (`firebase/firestore` modular SDK), Vite, Vitest with jsdom, `@testing-library/react`, Tailwind v4, Material Symbols.

---

## Source of Truth

Spec artifacts in `openspec/changes/project-aggregate-phase1/`:

- `proposal.md` — motivation, scope
- `design.md` — architectural decisions (schema β, reverse index, sync strategy, remount-via-key)
- `tasks.md` — the original coarse task list this plan expands
- `specs/project-management/spec.md` — Project CRUD, list UI, security rules requirements
- `specs/firestore-persistence/spec.md` — `useFirestoreDoc`, SaveIndicator, LWW merge
- `specs/user-provisioning/spec.md` — `lastOpenedProjectId` field
- `specs/localstorage-persistence/spec.md` — removed Rules/Cards/Board/Tokens localStorage requirements

Each spec requirement is referenced inline by its `Requirement: <name>` heading so every task ties back.

---

## File Structure

**New files**

| Path | Responsibility |
|---|---|
| `src/domain/project.ts` | `Project` / `ProjectRef` / `Role` types, `DEFAULT_PROJECT_NAME`, `PROJECT_SCHEMA_VERSION` |
| `src/hooks/useFirestoreDoc.ts` | Shared Firestore sync hook (read once, onSnapshot, debounced write, unmount flush) |
| `src/contexts/ProjectContext.tsx` | Project list, activeProjectId, CRUD, first-login provisioning, last-opened hydration |
| `src/contexts/SyncStatusContext.tsx` | Collects per-domain sync status → feeds `SaveIndicator` |
| `src/components/ProjectListScreen.tsx` | Card grid with create/open/rename/delete |
| `src/components/ActiveProjectRoot.tsx` | Trivial wrapper remounted via `key={activeProjectId}` |
| `src/components/SaveIndicator.tsx` | `Saving… / Saved just now / error` pill |

**Modified files**

| Path | Change |
|---|---|
| `src/lib/firebase.ts` | `initializeFirestore(app, { localCache: persistentLocalCache() })`; re-export `collection`, `query`, `where`, `runTransaction`, `deleteDoc`, `updateDoc`, `serverTimestamp`, `onSnapshot`, `setDoc`, `getDoc`, `doc`, `writeBatch`; `provisionUserProfile` uses `{ merge: true }` on the create branch too so `lastOpenedProjectId` is never overwritten |
| `src/contexts/RulesContext.tsx` | Use `useFirestoreDoc<Rules>`; drop localStorage |
| `src/contexts/CardsContext.tsx` | Persisted slice = `Card[]`; UI (`activeDeckType`, `selectedCardId`) in sibling `useState` |
| `src/contexts/BoardContext.tsx` | Persisted slice = `Tile[]`; UI (`selectedTileId`) in sibling `useState` |
| `src/contexts/TokensContext.tsx` | Persisted slice = `Token[]`; UI (`activeCategory`, `selectedTokenId`) in sibling `useState` |
| `src/contexts/LibraryContext.tsx` | Unchanged (still localStorage) |
| `src/App.tsx` | Add `ProjectProvider`, `SyncStatusProvider`; route to `ProjectListScreen` when `activeProjectId === null || activeScreen === 'projects'`; wrap design providers in `<ActiveProjectRoot key={activeProjectId}>` |
| `src/components/Layout.tsx` | Add `Projects` nav item, mount `<SaveIndicator />` in header when project active |
| `src/types.ts` | Add `'projects'` to `Screen` union |
| `firestore.rules` | Add blocks for `projects/{pid}`, `projects/{pid}/design/{doc}`, `users/{uid}/projectRefs/{pid}`; `isMember` primitive |
| `scripts/seed-emulator.ts` | Replace per-user `gameData/*` seeding with a demo project + projectRefs + design docs |
| `src/test/firebase-mocks.ts` | Add mocks for `collection`, `query`, `where`, `getDocs`, `runTransaction`, `updateDoc`, `deleteDoc`, `writeBatch`, `onSnapshot` that returns unsubscribe |
| `src/contexts/AuthContext.test.tsx`, `src/lib/firebase.test.ts` | Update `firebase/firestore` mock factories to include the new re-exports |
| `CLAUDE.md` | Provider nesting + persistence notes |
| `openspec/domain-model.md` | Project section: "implemented (Phase 1)" |

**Deleted files / test fixtures**

None. (Existing domain context tests that assert on localStorage for Rules/Cards/Board/Tokens do not exist in the repo today — verified via `ls src/contexts/`. No deletions needed.)

---

## Design Decisions (baked in, do not re-debate)

1. **Persisted slice vs UI state split.** `Rules` persists in full. For Cards/Board/Tokens the reducer state mixes domain data with UI selection; the hook persists only the domain slice (`Card[]`, `Tile[]`, `Token[]`). UI state lives in a sibling `useState` inside the same provider, so `<ActiveProjectRoot key={activeProjectId}>` still resets it on switch.
2. **Sync status aggregation.** Each domain provider calls `useSyncStatus().report('rules' | 'cards' | 'board' | 'tokens', status)`. `SaveIndicator` consumes the aggregate and renders the worst state: `error > saving > saved > idle`.
3. **Snapshot → local merge.** `useFirestoreDoc` dispatches a reserved `{ type: '__REMOTE_SYNC__', value }` action on every incoming snapshot. Domain reducers handle it as a pure replace of their persisted slice.
4. **`runTransaction` on create/delete.** Create writes `projects/{pid}` + `users/{uid}/projectRefs/{pid}` in one transaction. Delete removes both + best-effort cleans `projects/{pid}/design/*` in a `writeBatch` *after* the transaction commits (rules already deny orphan reads post-delete; cleanup failure just leaves dead docs behind, acceptable for Phase 1).
5. **`serverTimestamp()` in transactions.** We use server timestamps for `createdAt`/`updatedAt` on the project doc. For `projectRefs.addedAt` we do the same.
6. **`debounceMs = 500`** (spec default). Configurable per-hook call but every domain uses the default.
7. **`Saved just now` window = 5000 ms** after the write promise resolves.

---

## Task 1 — Project domain types + Screen union

**Files:**
- Create: `src/domain/project.ts`
- Modify: `src/types.ts`
- Test: `src/domain/project.test.ts`

Implements `Requirement: Project domain type` and `Requirement: Screen navigation includes projects`.

- [ ] **Step 1: Write failing test**

Create `src/domain/project.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PROJECT_SCHEMA_VERSION,
  DEFAULT_PROJECT_NAME,
  makeNewProject,
  type Project,
  type ProjectRef,
  type Role,
} from './project';

describe('domain/project', () => {
  it('exposes the schema version constant', () => {
    expect(PROJECT_SCHEMA_VERSION).toBe(1);
  });

  it('exposes the default project name', () => {
    expect(DEFAULT_PROJECT_NAME).toBe('My First Project');
  });

  it('makeNewProject returns a project with owner-only membership', () => {
    const now = new Date();
    const p: Project = makeNewProject({
      id: 'p_1',
      ownerId: 'uid_A',
      name: 'My Project',
      now,
    });
    expect(p.id).toBe('p_1');
    expect(p.ownerId).toBe('uid_A');
    expect(p.members).toEqual({ uid_A: 'owner' });
    expect(p.name).toBe('My Project');
    expect(p.schemaVersion).toBe(1);
    expect(p.createdAt).toBe(now);
    expect(p.updatedAt).toBe(now);
    expect(p.description).toBeUndefined();
    expect(p.thumbnail).toBeUndefined();
  });

  it('Role is a string union for future extension', () => {
    const r: Role = 'owner';
    expect(r).toBe('owner');
  });

  it('ProjectRef fields are assignable', () => {
    const ref: ProjectRef = {
      role: 'owner',
      addedAt: new Date(),
      lastOpenedAt: new Date(),
    };
    expect(ref.role).toBe('owner');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/domain/project.test.ts`
Expected: file not found / module resolution error.

- [ ] **Step 3: Implement `src/domain/project.ts`**

```ts
export const PROJECT_SCHEMA_VERSION = 1 as const;
export const DEFAULT_PROJECT_NAME = 'My First Project' as const;

export type Role = 'owner';

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

(`createdAt`/`updatedAt` are typed `Date | unknown` because Firestore will assign `serverTimestamp()` sentinel objects at write-time; reads come back as `Timestamp`.)

- [ ] **Step 4: Add `'projects'` to Screen union**

Edit `src/types.ts`:

```ts
export type Screen = 'board' | 'cards' | 'rules' | 'tokens' | 'library' | 'settings' | 'projects';
```

- [ ] **Step 5: Run — expect PASS**

Run: `npx vitest run src/domain/project.test.ts && npm run lint`
Expected: all tests pass, `tsc --noEmit` succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/domain/project.ts src/domain/project.test.ts src/types.ts
git commit -m "feat(project): add Project domain type + screen navigation slot"
```

---

## Task 2 — Firebase module: offline persistence, re-exports, merge provisioning

**Files:**
- Modify: `src/lib/firebase.ts`
- Modify: `src/lib/firebase.test.ts`
- Modify: `src/test/firebase-mocks.ts`
- Modify: `src/contexts/AuthContext.test.tsx`

Implements `Requirement: Firestore offline persistence enabled` and the merge half of `Requirement: User profile created on first sign-in` / `Requirement: User profile updated on subsequent sign-ins` (merge-always so `lastOpenedProjectId` is never clobbered).

- [ ] **Step 1: Extend the test mocks first**

Edit `src/test/firebase-mocks.ts` — append after the existing Firestore mock exports:

```ts
// Additional Firestore API mocks for project work
export const mockCollection = vi.fn((...args: any[]) => ({ _path: args.slice(1).join('/'), _collection: true }));
export const mockQuery = vi.fn((ref: any) => ref);
export const mockWhere = vi.fn((field: string, op: string, value: any) => ({ _where: { field, op, value } }));
export const mockGetDocs = vi.fn();
export const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
export const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
export const mockRunTransaction = vi.fn();
export const mockWriteBatch = vi.fn();
export const mockInitializeFirestore = vi.fn(() => ({}));
export const mockPersistentLocalCache = vi.fn(() => ({ _cache: 'persistent' }));

// onSnapshot: register callback, return an unsubscribe spy
type SnapshotCb = (snap: any) => void;
const snapshotRegistry = new Map<string, SnapshotCb>();
export const mockOnSnapshotImpl = vi.fn((ref: any, cb: SnapshotCb) => {
  const key = ref._path ?? Math.random().toString();
  snapshotRegistry.set(key, cb);
  return vi.fn(() => snapshotRegistry.delete(key));
});
export function emitSnapshot(path: string, data: Record<string, any> | null) {
  const cb = snapshotRegistry.get(path);
  if (!cb) throw new Error(`No snapshot listener registered for ${path}`);
  cb(mockDocSnapshot(data !== null, data ?? undefined));
}

// Reset helper — extend existing resetAllMocks
export function resetFirestoreProjectMocks() {
  mockCollection.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockGetDocs.mockClear();
  mockUpdateDoc.mockClear().mockResolvedValue(undefined);
  mockDeleteDoc.mockClear().mockResolvedValue(undefined);
  mockRunTransaction.mockClear();
  mockWriteBatch.mockClear();
  mockInitializeFirestore.mockClear().mockReturnValue({});
  mockPersistentLocalCache.mockClear().mockReturnValue({ _cache: 'persistent' });
  mockOnSnapshotImpl.mockClear();
  snapshotRegistry.clear();
}
```

- [ ] **Step 2: Update the existing `resetAllMocks` to also reset new ones**

Still in `src/test/firebase-mocks.ts`, change `resetAllMocks`:

```ts
export function resetAllMocks() {
  authStateCallback = null;
  mockOnAuthStateChanged.mockClear();
  mockSignInWithPopup.mockClear();
  mockSignOut.mockClear().mockResolvedValue(undefined);
  mockSetDoc.mockClear().mockResolvedValue(undefined);
  mockGetDoc.mockClear();
  mockDoc.mockClear().mockImplementation((...args: any[]) => ({ _path: args.slice(1).join('/') }));
  mockServerTimestamp.mockClear().mockReturnValue({ _type: 'serverTimestamp' });
  mockGetDocFromServer.mockClear().mockResolvedValue(undefined);
  mockOnSnapshot.mockClear();
  resetFirestoreProjectMocks();
}
```

- [ ] **Step 3: Write failing test for merge-always provisioning**

Edit `src/lib/firebase.test.ts` and add a new test inside `describe('provisionUserProfile', …)`:

```ts
it('uses merge: true on first-time provisioning to preserve lastOpenedProjectId written concurrently', async () => {
  mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
  const user = createMockUser() as any;

  await provisionUserProfile(user);

  expect(mockSetDoc).toHaveBeenCalledOnce();
  const [, data, options] = mockSetDoc.mock.calls[0];
  expect(options).toEqual({ merge: true });
  expect(data.createdAt).toEqual({ _type: 'serverTimestamp' });
  expect(data.lastLoginAt).toEqual({ _type: 'serverTimestamp' });
});
```

Also loosen / delete the existing assertion `expect(mockSetDoc.mock.calls[0][2]).toBeUndefined();` in the "creates a new profile document on first sign-in" test — replace with `expect(options).toEqual({ merge: true });` to reflect the new merge-always behavior.

- [ ] **Step 4: Run — expect FAIL**

Run: `npx vitest run src/lib/firebase.test.ts`
Expected: the new merge-always test fails (first branch currently writes without options).

- [ ] **Step 5: Implement merge-always branch in `provisionUserProfile`**

Edit `src/lib/firebase.ts`:

```ts
export async function provisionUserProfile(user: User) {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'main');
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    await setDoc(profileRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(profileRef, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }
}
```

- [ ] **Step 6: Enable Firestore offline persistence**

Still in `src/lib/firebase.ts`, replace the import line and `db` initialization:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
  connectFirestoreEmulator,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';

// ...config unchanged...

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, firestoreDatabaseId || undefined);
```

Note: `initializeFirestore`'s third arg (`databaseId`) is optional in the modular SDK. If `firestoreDatabaseId` is empty, pass `undefined` to use the default. Check `firebase/firestore` TS types in this repo (`npm run lint`) and adjust if the signature differs; if it does, fall back to:

```ts
export const db = firestoreDatabaseId
  ? initializeFirestore(app, { localCache: persistentLocalCache() }, firestoreDatabaseId)
  : initializeFirestore(app, { localCache: persistentLocalCache() });
```

Add the re-exports at the bottom of the file:

```ts
export {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  onAuthStateChanged,
};
export type { User };
```

(Remove the existing `export { onAuthStateChanged }; export type { User };` at the bottom to avoid duplication.)

- [ ] **Step 7: Extend `firebase/firestore` mock factories in tests**

In `src/lib/firebase.test.ts` AND `src/contexts/AuthContext.test.tsx`, the `vi.mock('firebase/firestore', () => ({ … }))` factory must expose the new symbols. Replace with:

```ts
vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  getDocFromServer: mockGetDocFromServer,
  serverTimestamp: mockServerTimestamp,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction,
  writeBatch: mockWriteBatch,
  connectFirestoreEmulator: vi.fn(),
}));
```

Import the new mocks at the top of each file alongside the existing imports.

- [ ] **Step 8: Run — expect PASS**

Run: `npx vitest run src/lib/firebase.test.ts src/contexts/AuthContext.test.tsx && npm run lint`
Expected: all tests green, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/firebase.ts src/lib/firebase.test.ts src/test/firebase-mocks.ts src/contexts/AuthContext.test.tsx
git commit -m "feat(firebase): enable Firestore offline persistence; merge-always provisioning"
```

---

## Task 3 — Firestore security rules for projects

**Files:**
- Modify: `firestore.rules`

Implements `Requirement: Security rules for projects collection`, `Requirement: Security rules for design subcollection`, `Requirement: Security rules for projectRefs`, `Requirement: Membership primitive extensible to Phase 2`.

*No client-side unit tests; verification is via the Emulator Rules Playground (Step 3).*

- [ ] **Step 1: Add project rules**

In `firestore.rules`, insert before the `// Default deny` block:

```
    // ===============================================================
    // Projects
    // ===============================================================

    function isMember(projectData) {
      return isAuthenticated() && projectData.members[request.auth.uid] != null;
    }

    function isProjectOwner(projectData) {
      return isAuthenticated() && request.auth.uid == projectData.ownerId;
    }

    match /projects/{projectId} {
      allow read: if isMember(resource.data);
      allow create: if isAuthenticated()
                    && request.resource.data.ownerId == request.auth.uid
                    && request.resource.data.members[request.auth.uid] == 'owner';
      allow update: if isMember(resource.data)
                    && request.resource.data.ownerId == resource.data.ownerId;
      allow delete: if isProjectOwner(resource.data);

      match /design/{docId} {
        allow read, write: if isMember(
          get(/databases/$(database)/documents/projects/$(projectId)).data
        );
      }
    }

    match /users/{userId}/projectRefs/{projectId} {
      allow read, write: if isOwner(userId);
    }
```

- [ ] **Step 2: Start the emulator**

Run (in a separate terminal if one is not already running):

```bash
npm run emulator:start
```

Expected: Firestore emulator starts on `localhost:8080`, UI on `localhost:4000`. The rules file is live-reloaded.

- [ ] **Step 3: Verify rules via the Emulator Rules Playground**

Open `http://localhost:4000/firestore`, click `Rules` tab, `Playground`. Run these scenarios:

| Scenario | Setup | Expected |
|---|---|---|
| Non-member read denied | `auth.uid = "uid_B"`; `projects/p_1` exists with `members = { uid_A: "owner" }` | `allow read` → **Deny** |
| Owner read allowed | `auth.uid = "uid_A"`; same data | `allow read` → **Allow** |
| Create with wrong ownerId denied | `auth.uid = "uid_A"`; `request.resource.data = { ownerId: "uid_B", members: { uid_B: "owner" }, … }` | `allow create` → **Deny** |
| Valid create allowed | `auth.uid = "uid_A"`; `request.resource.data = { ownerId: "uid_A", members: { uid_A: "owner" }, … }` | `allow create` → **Allow** |
| projectRefs cross-user read denied | `auth.uid = "uid_B"` reads `users/uid_A/projectRefs/p_1` | **Deny** |
| design doc member write allowed | Owner `uid_A` writes `projects/p_1/design/board` | **Allow** |
| design doc non-member read denied | `uid_B` reads `projects/p_1/design/board` | **Deny** |

If any scenario misbehaves, re-read the failing rule block and iterate until all 7 pass.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat(firestore): rules for projects, design subcollection, and projectRefs"
```

---

## Task 4 — `useFirestoreDoc` shared sync hook

**Files:**
- Create: `src/hooks/useFirestoreDoc.ts`
- Test: `src/hooks/useFirestoreDoc.test.tsx`

Implements `Requirement: useFirestoreDoc shared sync hook` and `Requirement: Last-write-wins merge across tabs`, plus `Requirement: Sync aligns to active project boundary` (the remount side is handled by Task 10).

**Hook contract:**

```ts
type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseFirestoreDocOptions<T, A> {
  defaults: T;
  reducer: (state: T, action: A | RemoteSyncAction<T>) => T;
  debounceMs?: number;         // default 500
  savedLingerMs?: number;      // default 5000
}

type RemoteSyncAction<T> = { type: '__REMOTE_SYNC__'; value: T };

interface UseFirestoreDocResult<T, A> {
  state: T;
  dispatch: React.Dispatch<A>;
  status: SyncStatus;
  error?: Error;
}

function useFirestoreDoc<T, A>(
  path: string,             // e.g. 'projects/p_1/design/rules'
  opts: UseFirestoreDocOptions<T, A>,
): UseFirestoreDocResult<T, A>;
```

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useFirestoreDoc.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockOnSnapshotImpl,
  mockDocSnapshot,
  emitSnapshot,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(() => ({ _type: 'ts' })),
  // Everything else unused in these tests
  collection: vi.fn(), query: vi.fn(), where: vi.fn(), getDocs: vi.fn(),
  updateDoc: vi.fn(), deleteDoc: vi.fn(), runTransaction: vi.fn(), writeBatch: vi.fn(),
  connectFirestoreEmulator: vi.fn(), initializeFirestore: vi.fn(() => ({})), persistentLocalCache: vi.fn(),
  getDocFromServer: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(), signOut: vi.fn(), onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));

import { useFirestoreDoc } from './useFirestoreDoc';

type Counter = { count: number };
type CounterAction = { type: 'INC' } | { type: 'SET'; value: number };

function reducer(state: Counter, action: any): Counter {
  if (action.type === '__REMOTE_SYNC__') return action.value;
  if (action.type === 'INC') return { count: state.count + 1 };
  if (action.type === 'SET') return { count: action.value };
  return state;
}

describe('useFirestoreDoc', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('seeds from defaults when the doc does not exist', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.state).toEqual({ count: 0 });
  });

  it('seeds from Firestore when the doc exists', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { count: 42 }));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.state).toEqual({ count: 42 });
  });

  it('coalesces rapid dispatches into a single debounced setDoc', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
        debounceMs: 500,
      }),
    );
    await act(async () => { await Promise.resolve(); });

    act(() => { result.current.dispatch({ type: 'INC' }); });
    act(() => { result.current.dispatch({ type: 'INC' }); });
    act(() => { result.current.dispatch({ type: 'INC' }); });
    expect(result.current.state).toEqual({ count: 3 });
    expect(mockSetDoc).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });
    expect(mockSetDoc).toHaveBeenCalledOnce();
    const [, payload, options] = mockSetDoc.mock.calls[0];
    expect(payload).toEqual({ count: 3 });
    expect(options).toEqual({ merge: true });
  });

  it('transitions status: idle → saving → saved', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    let resolveWrite!: () => void;
    mockSetDoc.mockImplementation(() => new Promise<void>((r) => { resolveWrite = r; }));

    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
        debounceMs: 100,
        savedLingerMs: 1000,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('idle');

    act(() => { result.current.dispatch({ type: 'INC' }); });
    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); });
    expect(result.current.status).toBe('saving');

    await act(async () => { resolveWrite(); await Promise.resolve(); });
    expect(result.current.status).toBe('saved');

    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(result.current.status).toBe('idle');
  });

  it('replaces local state on incoming snapshot (last-write-wins)', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { count: 1 }));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
      }),
    );
    await act(async () => { await Promise.resolve(); });

    act(() => { emitSnapshot('projects/p/design/x', { count: 99 }); });
    expect(result.current.state).toEqual({ count: 99 });
  });

  it('flushes pending write on unmount', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const { result, unmount } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
        debounceMs: 500,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    act(() => { result.current.dispatch({ type: 'INC' }); });
    expect(mockSetDoc).not.toHaveBeenCalled();
    unmount();
    expect(mockSetDoc).toHaveBeenCalledOnce();
    expect(mockSetDoc.mock.calls[0][1]).toEqual({ count: 1 });
  });

  it('reports status error when setDoc rejects', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    mockSetDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
        debounceMs: 100,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    act(() => { result.current.dispatch({ type: 'INC' }); });
    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); });
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('permission-denied');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/hooks/useFirestoreDoc.test.tsx`
Expected: all 7 tests fail (module doesn't exist).

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useFirestoreDoc.ts`:

```ts
import { useEffect, useReducer, useRef, useState } from 'react';
import { doc as fsDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export type RemoteSyncAction<T> = { type: '__REMOTE_SYNC__'; value: T };

export interface UseFirestoreDocOptions<T, A> {
  defaults: T;
  reducer: (state: T, action: A | RemoteSyncAction<T>) => T;
  debounceMs?: number;
  savedLingerMs?: number;
}

export interface UseFirestoreDocResult<T, A> {
  state: T;
  dispatch: React.Dispatch<A>;
  status: SyncStatus;
  error?: Error;
}

function pathToSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export function useFirestoreDoc<T, A>(
  path: string,
  opts: UseFirestoreDocOptions<T, A>,
): UseFirestoreDocResult<T, A> {
  const {
    defaults,
    reducer,
    debounceMs = 500,
    savedLingerMs = 5000,
  } = opts;

  const [state, dispatch] = useReducer(reducer, defaults);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<Error | undefined>();

  const hydratedRef = useRef(false);
  const pendingValueRef = useRef<T | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedLingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<T>(state);
  const isMountedRef = useRef(true);

  latestStateRef.current = state;

  // Initial load + onSnapshot subscription
  useEffect(() => {
    isMountedRef.current = true;
    const ref = fsDoc(db, ...pathToSegments(path));

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        const snap = await getDoc(ref);
        if (!isMountedRef.current) return;
        if (snap.exists()) {
          dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as any);
        }
        // else: keep defaults (already the reducer's initial state)
        hydratedRef.current = true;
      } catch (e) {
        if (!isMountedRef.current) return;
        setStatus('error');
        setError(e as Error);
      }

      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (!isMountedRef.current) return;
          if (snap.exists()) {
            dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as any);
          }
        },
        (err) => {
          if (!isMountedRef.current) return;
          setStatus('error');
          setError(err);
        },
      );
    })();

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) unsubscribe();
      // Flush pending write synchronously before teardown
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        if (pendingValueRef.current !== null) {
          const payload = pendingValueRef.current;
          pendingValueRef.current = null;
          // Fire-and-forget; unmounting context won't await
          setDoc(ref, payload as any, { merge: true }).catch(() => { /* noop on unmount */ });
        }
      }
      if (savedLingerTimerRef.current) {
        clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Debounced write on state changes (skip until hydrated; skip if this change came from remote sync)
  useEffect(() => {
    if (!hydratedRef.current) return;

    pendingValueRef.current = state;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      debounceTimerRef.current = null;
      const payload = pendingValueRef.current;
      pendingValueRef.current = null;
      if (payload === null) return;

      setStatus('saving');
      setError(undefined);
      try {
        const ref = fsDoc(db, ...pathToSegments(path));
        await setDoc(ref, payload as any, { merge: true });
        if (!isMountedRef.current) return;
        setStatus('saved');
        if (savedLingerTimerRef.current) clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setStatus('idle');
        }, savedLingerMs);
      } catch (e) {
        if (!isMountedRef.current) return;
        setStatus('error');
        setError(e as Error);
      }
    }, debounceMs);
    // state intentionally triggers re-schedule; path is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return { state, dispatch: dispatch as React.Dispatch<A>, status, error };
}
```

**Important subtlety**: remote-sync dispatches will trigger the debounced-write effect, which would echo the value back to Firestore. To prevent the echo, guard: if the incoming `__REMOTE_SYNC__` value is already equal to the server's value, the debounced write is an idempotent no-op (`merge: true`, same content). This is acceptable for Phase 1 — a single redundant write per snapshot. If that's too chatty, replace with a tag: the remote-sync action could set a ref that the debounced-write effect consults to skip the next tick.

**Decision: skip the next write after a remote sync.** Add to the reducer-handling path:

Change the hook: track a `skipNextWriteRef`, set to true immediately after dispatching `__REMOTE_SYNC__`, and consulted by the debounced-write effect:

```ts
const skipNextWriteRef = useRef(false);

// in load:
dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as any);
skipNextWriteRef.current = true;

// in onSnapshot callback:
dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as any);
skipNextWriteRef.current = true;

// in debounced write effect, at the top:
if (!hydratedRef.current) return;
if (skipNextWriteRef.current) {
  skipNextWriteRef.current = false;
  return;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/hooks/useFirestoreDoc.test.tsx`
Expected: all 7 tests green. If the "debounced write" test fires an extra write from the seed phase, implement the `skipNextWriteRef` guard described above.

- [ ] **Step 5: Run full suite + lint**

Run: `npm run test && npm run lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useFirestoreDoc.ts src/hooks/useFirestoreDoc.test.tsx
git commit -m "feat(hooks): add useFirestoreDoc with debounced writes and snapshot merge"
```

---

## Task 5 — `SyncStatusContext`

**Files:**
- Create: `src/contexts/SyncStatusContext.tsx`
- Test: `src/contexts/SyncStatusContext.test.tsx`

Implements the aggregation side of `Requirement: SaveIndicator UI component` (the component is Task 11).

- [ ] **Step 1: Write failing test**

Create `src/contexts/SyncStatusContext.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { SyncStatusProvider, useSyncStatus, useAggregateStatus } from './SyncStatusContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SyncStatusProvider>{children}</SyncStatusProvider>;
}

describe('SyncStatusContext', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useAggregateStatus(), { wrapper });
    expect(result.current).toBe('idle');
  });

  it('reports saving when any domain is saving', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => { result.current.reporter.report('rules', 'saving'); });
    expect(result.current.agg).toBe('saving');
  });

  it('reports error taking precedence over saving', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => {
      result.current.reporter.report('rules', 'saving');
      result.current.reporter.report('cards', 'error');
    });
    expect(result.current.agg).toBe('error');
  });

  it('reports saved when all settled with at least one saved', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => {
      result.current.reporter.report('rules', 'saved');
      result.current.reporter.report('cards', 'idle');
    });
    expect(result.current.agg).toBe('saved');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/SyncStatusContext.test.tsx`
Expected: module not found.

- [ ] **Step 3: Implement**

Create `src/contexts/SyncStatusContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SyncStatus } from '../hooks/useFirestoreDoc';

type DomainKey = 'rules' | 'cards' | 'board' | 'tokens';
type StatusMap = Record<DomainKey, SyncStatus>;

const INITIAL: StatusMap = { rules: 'idle', cards: 'idle', board: 'idle', tokens: 'idle' };

interface ReporterValue {
  report: (key: DomainKey, status: SyncStatus) => void;
}

const ReporterContext = createContext<ReporterValue | null>(null);
const StatusContext = createContext<StatusMap>(INITIAL);

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<StatusMap>(INITIAL);
  const report = useCallback((key: DomainKey, status: SyncStatus) => {
    setStatuses((prev) => (prev[key] === status ? prev : { ...prev, [key]: status }));
  }, []);
  const reporter = useMemo(() => ({ report }), [report]);

  return (
    <ReporterContext.Provider value={reporter}>
      <StatusContext.Provider value={statuses}>
        {children}
      </StatusContext.Provider>
    </ReporterContext.Provider>
  );
}

export function useSyncStatus(): ReporterValue {
  const ctx = useContext(ReporterContext);
  if (!ctx) throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  return ctx;
}

export function useAggregateStatus(): SyncStatus {
  const map = useContext(StatusContext);
  const values = Object.values(map);
  if (values.includes('error')) return 'error';
  if (values.includes('saving')) return 'saving';
  if (values.includes('saved')) return 'saved';
  return 'idle';
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/SyncStatusContext.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/SyncStatusContext.tsx src/contexts/SyncStatusContext.test.tsx
git commit -m "feat(sync): aggregate per-domain sync status for SaveIndicator"
```

---

## Task 6 — `ProjectContext` (CRUD, list, open/close, provisioning)

**Files:**
- Create: `src/contexts/ProjectContext.tsx`
- Test: `src/contexts/ProjectContext.test.tsx`

Implements every requirement under `project-management/spec.md` except the list-screen UI (Task 12) and the remount behavior (Task 10).

The context depends on `useAuth()` for `user.uid`. The happy path runs after the user is signed in.

**Shape:**

```ts
interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  updatedAt: unknown; // Firestore Timestamp
}

interface ProjectContextValue {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  loading: boolean;
  createProject: (name: string) => Promise<string>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  closeActive: () => void;
}
```

- [ ] **Step 1: Write failing tests**

Create `src/contexts/ProjectContext.test.tsx`. This file is long; it covers each requirement. Key test cases:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import {
  mockDoc,
  mockCollection,
  mockGetDoc,
  mockGetDocs,
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockRunTransaction,
  mockOnSnapshotImpl,
  mockWriteBatch,
  mockDocSnapshot,
  createMockUser,
  emitAuthState,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(), signOut: vi.fn(),
  onAuthStateChanged: (await import('../test/firebase-mocks')).mockOnAuthStateChanged,
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})), persistentLocalCache: vi.fn(),
  doc: mockDoc, collection: mockCollection,
  query: (ref: any) => ref, where: vi.fn((f, o, v) => ({ f, o, v })),
  getDoc: mockGetDoc, getDocs: mockGetDocs, setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc, deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction, writeBatch: mockWriteBatch,
  onSnapshot: mockOnSnapshotImpl, serverTimestamp: vi.fn(() => ({ _type: 'ts' })),
  getDocFromServer: vi.fn().mockResolvedValue(undefined),
  connectFirestoreEmulator: vi.fn(),
}));

import { AuthProvider } from './AuthContext';
import { ProjectProvider, useProjects } from './ProjectContext';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProjectProvider>{children}</ProjectProvider>
    </AuthProvider>
  );
}

describe('ProjectContext', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('auto-provisions "My First Project" when user has no projectRefs', async () => {
    // getDocs on projectRefs collection returns empty
    mockGetDocs.mockResolvedValueOnce({ docs: [], empty: true });
    // profile lastOpenedProjectId: not set
    mockGetDoc.mockResolvedValueOnce(mockDocSnapshot(true, { /* no lastOpenedProjectId */ }));
    // runTransaction resolves with a generated id
    mockRunTransaction.mockImplementation(async (_db, fn) => {
      await fn({
        set: vi.fn(),
        get: vi.fn().mockResolvedValue(mockDocSnapshot(false)),
      });
      return 'p_auto';
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe('p_auto'));
    expect(mockRunTransaction).toHaveBeenCalledOnce();
  });

  it('hydrates activeProjectId from profile.lastOpenedProjectId when valid', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'p_1', data: () => ({ role: 'owner', addedAt: new Date() }) },
      ],
      empty: false,
    });
    // project doc read for resolution
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.startsWith('users/') && ref._path?.endsWith('/profile/main')) {
        return Promise.resolve(mockDocSnapshot(true, { lastOpenedProjectId: 'p_1' }));
      }
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'First', ownerId: 'uid_A', members: { uid_A: 'owner' },
          updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe('p_1'));
    expect(result.current.projects.map((p) => p.id)).toEqual(['p_1']);
  });

  it('clears stale lastOpenedProjectId and lands on list', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) {
        return Promise.resolve(mockDocSnapshot(true, { lastOpenedProjectId: 'p_old' }));
      }
      if (ref._path === 'projects/p_old') {
        return Promise.resolve(mockDocSnapshot(false));
      }
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'Live', ownerId: 'uid_A', members: { uid_A: 'owner' }, updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe(null));
    // profile was cleaned: setDoc with lastOpenedProjectId: deleteField-equivalent or undefined
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('createProject writes project + projectRefs transactionally', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [], empty: true });
    mockGetDoc.mockResolvedValueOnce(mockDocSnapshot(true, {}));
    const txnSet = vi.fn();
    mockRunTransaction.mockImplementation(async (_db, fn) => {
      await fn({ set: txnSet, get: vi.fn().mockResolvedValue(mockDocSnapshot(false)) });
      return 'p_new';
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Once auto-provision has settled, call createProject again
    let newId = '';
    await act(async () => { newId = await result.current.createProject('Side Quest'); });
    expect(newId).toBe('p_new');
    // txn.set called twice: once for projects/*, once for projectRefs
    expect(txnSet).toHaveBeenCalledTimes(2 + 2); // provisioning + new create
  });

  it('deleteProject runs a transaction and clears activeProjectId if deleting the active one', async () => {
    // Setup: one project, active
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) {
        return Promise.resolve(mockDocSnapshot(true, { lastOpenedProjectId: 'p_1' }));
      }
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'X', ownerId: 'uid_A', members: { uid_A: 'owner' }, updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const txnDelete = vi.fn();
    mockRunTransaction.mockImplementation(async (_db, fn) => { await fn({ delete: txnDelete, get: vi.fn() }); });
    // Cleanup batch for design/*
    const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    mockWriteBatch.mockReturnValue(batch);
    mockGetDocs.mockResolvedValueOnce({ docs: [{ ref: { _path: 'projects/p_1/design/board' } }], empty: false });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe('p_1'));

    await act(async () => { await result.current.deleteProject('p_1'); });
    expect(txnDelete).toHaveBeenCalledTimes(2); // projects/p_1 + projectRefs entry
    expect(result.current.activeProjectId).toBe(null);
  });

  it('openProject updates activeProjectId and writes lastOpenedProjectId', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'p_1', data: () => ({ role: 'owner' }) },
        { id: 'p_2', data: () => ({ role: 'owner' }) },
      ],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_1' || ref._path === 'projects/p_2') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: ref._path, ownerId: 'uid_A', members: { uid_A: 'owner' }, updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeProjectId).toBe(null);

    await act(async () => { await result.current.openProject('p_2'); });
    expect(result.current.activeProjectId).toBe('p_2');
    // setDoc called with { lastOpenedProjectId: 'p_2' } on profile
    const profileCall = mockSetDoc.mock.calls.find(
      ([ref]) => ref._path?.endsWith('/profile/main'),
    );
    expect(profileCall).toBeTruthy();
    expect(profileCall![1].lastOpenedProjectId).toBe('p_2');
    expect(profileCall![2]).toEqual({ merge: true });
  });

  it('renameProject updates name and updatedAt', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'Old', ownerId: 'uid_A', members: { uid_A: 'owner' }, updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.renameProject('p_1', 'New'); });
    expect(mockUpdateDoc).toHaveBeenCalled();
    const [ref, data] = mockUpdateDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1');
    expect(data.name).toBe('New');
    expect(data.updatedAt).toBeDefined();
  });

  it('closeActive clears activeProjectId', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_1', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, { lastOpenedProjectId: 'p_1' }));
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'X', ownerId: 'uid_A', members: { uid_A: 'owner' }, updatedAt: new Date(),
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe('p_1'));

    act(() => { result.current.closeActive(); });
    expect(result.current.activeProjectId).toBe(null);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/ProjectContext.test.tsx`
Expected: module not found.

- [ ] **Step 3: Implement `ProjectContext.tsx`**

Create `src/contexts/ProjectContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  DEFAULT_PROJECT_NAME,
  PROJECT_SCHEMA_VERSION,
  type Project,
} from '../domain/project';

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  updatedAt: unknown;
}

interface ProjectContextValue {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  loading: boolean;
  createProject: (name: string) => Promise<string>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  closeActive: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function generateId(): string {
  // Client-side id; matches the Firestore auto-id flavor closely enough
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedForUserRef = useRef<string | null>(null);

  const loadProjects = useCallback(async (uid: string): Promise<ProjectMeta[]> => {
    const refsSnap = await getDocs(collection(db, 'users', uid, 'projectRefs'));
    const ids = refsSnap.docs.map((d: any) => d.id);
    const metas: ProjectMeta[] = [];
    for (const id of ids) {
      const pSnap = await getDoc(doc(db, 'projects', id));
      if (!pSnap.exists()) continue;
      const data = pSnap.data() as Project;
      metas.push({
        id,
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        ownerId: data.ownerId,
        updatedAt: data.updatedAt,
      });
    }
    // Sort by updatedAt desc (best-effort; Timestamp objects are comparable)
    metas.sort((a, b) => {
      const av = (a.updatedAt as any)?.toMillis?.() ?? 0;
      const bv = (b.updatedAt as any)?.toMillis?.() ?? 0;
      return bv - av;
    });
    return metas;
  }, []);

  const createProject = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const projectId = generateId();
    const projectRef = doc(db, 'projects', projectId);
    const refDocRef = doc(db, 'users', uid, 'projectRefs', projectId);

    await runTransaction(db, async (tx) => {
      tx.set(projectRef, {
        id: projectId,
        ownerId: uid,
        members: { [uid]: 'owner' },
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: PROJECT_SCHEMA_VERSION,
      });
      tx.set(refDocRef, {
        role: 'owner',
        addedAt: serverTimestamp(),
      });
    });

    // Refresh list
    setProjects(await loadProjects(uid));
    return projectId;
  }, [user, loadProjects]);

  const renameProject = useCallback(async (projectId: string, newName: string) => {
    await updateDoc(doc(db, 'projects', projectId), {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    if (user) setProjects(await loadProjects(user.uid));
  }, [user, loadProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;

    await runTransaction(db, async (tx) => {
      tx.delete(doc(db, 'projects', projectId));
      tx.delete(doc(db, 'users', uid, 'projectRefs', projectId));
    });

    // Best-effort cleanup of design subdocuments (not transactional — rules
    // already deny reads of the deleted project, so orphans are harmless).
    try {
      const designSnap = await getDocs(collection(db, 'projects', projectId, 'design'));
      if (!designSnap.empty) {
        const batch = writeBatch(db);
        designSnap.docs.forEach((d: any) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {
      // Ignore cleanup failures
    }

    if (activeProjectId === projectId) setActiveProjectId(null);
    setProjects(await loadProjects(uid));
  }, [user, activeProjectId, loadProjects]);

  const openProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Not signed in');
    setActiveProjectId(projectId);
    await setDoc(
      doc(db, 'users', user.uid, 'profile', 'main'),
      { lastOpenedProjectId: projectId, lastLoginAt: serverTimestamp() },
      { merge: true },
    );
    await updateDoc(
      doc(db, 'users', user.uid, 'projectRefs', projectId),
      { lastOpenedAt: serverTimestamp() },
    ).catch(() => { /* best-effort */ });
  }, [user]);

  const closeActive = useCallback(() => {
    setActiveProjectId(null);
  }, []);

  // Hydrate on auth
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setLoading(true);
      initializedForUserRef.current = null;
      return;
    }
    if (initializedForUserRef.current === user.uid) return;
    initializedForUserRef.current = user.uid;

    (async () => {
      setLoading(true);
      try {
        let metas = await loadProjects(user.uid);

        // First-login auto-provisioning
        if (metas.length === 0) {
          const newId = await createProject(DEFAULT_PROJECT_NAME);
          setActiveProjectId(newId);
          metas = await loadProjects(user.uid);
          setProjects(metas);
          return;
        }

        setProjects(metas);

        // Last-opened hydration
        const profileSnap = await getDoc(doc(db, 'users', user.uid, 'profile', 'main'));
        const lastOpenedId = profileSnap.exists()
          ? (profileSnap.data() as any).lastOpenedProjectId
          : undefined;
        if (lastOpenedId && metas.some((m) => m.id === lastOpenedId)) {
          setActiveProjectId(lastOpenedId);
        } else if (lastOpenedId) {
          // Stale — clear it
          await setDoc(
            doc(db, 'users', user.uid, 'profile', 'main'),
            { lastOpenedProjectId: null },
            { merge: true },
          );
        }
      } finally {
        setLoading(false);
      }
    })();
    // createProject depends on `user` which triggers a new closure each render;
    // initializedForUserRef prevents re-entry per uid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
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
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectProvider');
  return ctx;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/ProjectContext.test.tsx`
Expected: all 7 tests pass. Iterate on mocks if ordering of `getDocs` / `getDoc` calls doesn't line up — set them up with `mockImplementation` rather than `mockResolvedValueOnce` for robustness.

- [ ] **Step 5: Run full suite + lint**

Run: `npm run test && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/contexts/ProjectContext.tsx src/contexts/ProjectContext.test.tsx
git commit -m "feat(projects): ProjectContext with CRUD, provisioning, and last-opened hydration"
```

---

## Task 7 — Migrate `RulesContext` to Firestore

**Files:**
- Modify: `src/contexts/RulesContext.tsx`
- Create: `src/contexts/RulesContext.test.tsx`

Implements the Rules slice of `Requirement: Domain contexts persist to Firestore`.

- [ ] **Step 1: Write failing test**

Create `src/contexts/RulesContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  mockDoc, mockGetDoc, mockSetDoc, mockOnSnapshotImpl, mockDocSnapshot,
  emitSnapshot, resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(), signOut: vi.fn(), onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})), persistentLocalCache: vi.fn(),
  doc: mockDoc, getDoc: mockGetDoc, setDoc: mockSetDoc, onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(), collection: vi.fn(), query: vi.fn(), where: vi.fn(),
  getDocs: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
  runTransaction: vi.fn(), writeBatch: vi.fn(),
  getDocFromServer: vi.fn(), connectFirestoreEmulator: vi.fn(),
}));

import { RulesProvider, useRules } from './RulesContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_RULES } from '../domain/rules';

function Probe() {
  const { rules, dispatch } = useRules();
  return (
    <div>
      <span data-testid="salary">{rules.economy.salary}</span>
      <button data-testid="edit" onClick={() => dispatch({ type: 'UPDATE_FIELD', section: 'economy', field: 'salary', value: 999 })}>edit</button>
    </div>
  );
}

describe('RulesContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  it('seeds from DEFAULT_RULES when the doc is missing', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('salary').textContent).toBe(String(DEFAULT_RULES.economy.salary));
  });

  it('writes to projects/{pid}/design/rules after debounce', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); });

    screen.getByTestId('edit').click();
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalled();
    const [ref] = mockSetDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1/design/rules');
  });

  it('applies remote snapshots to local state', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, DEFAULT_RULES));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); });
    act(() => {
      emitSnapshot('projects/p_1/design/rules', {
        ...DEFAULT_RULES,
        economy: { ...DEFAULT_RULES.economy, salary: 12345 },
      });
    });
    expect(screen.getByTestId('salary').textContent).toBe('12345');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/RulesContext.test.tsx`
Expected: prop `activeProjectId` isn't supported yet and localStorage branch runs; assertions fail.

- [ ] **Step 3: Rewrite `RulesContext.tsx`**

Replace the entire file:

```tsx
import React, { createContext, useContext, useEffect } from 'react';
import { Rules, DEFAULT_RULES } from '../domain/rules';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

type RulesAction =
  | { type: 'UPDATE_FIELD'; section: keyof Rules; field: string; value: unknown }
  | { type: 'RESET' };

interface RulesContextValue {
  rules: Rules;
  dispatch: React.Dispatch<RulesAction>;
}

const RulesContext = createContext<RulesContextValue | null>(null);

function rulesReducer(state: Rules, action: RulesAction | RemoteSyncAction<Rules>): Rules {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return action.value;
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          [action.field]: action.value,
        },
      };
    case 'RESET':
      return DEFAULT_RULES;
    default:
      return state;
  }
}

interface RulesProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function RulesProvider({ children, activeProjectId }: RulesProviderProps) {
  const { state: rules, dispatch, status } = useFirestoreDoc<Rules, RulesAction>(
    `projects/${activeProjectId}/design/rules`,
    { defaults: DEFAULT_RULES, reducer: rulesReducer },
  );

  const { report } = useSyncStatus();
  useEffect(() => { report('rules', status); }, [status, report]);

  return (
    <RulesContext.Provider value={{ rules, dispatch }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules(): RulesContextValue {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within a RulesProvider');
  }
  return context;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/RulesContext.test.tsx`

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: `App.tsx` will now error because `<RulesProvider>` requires `activeProjectId`. That's fixed in Task 12; continue.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/RulesContext.tsx src/contexts/RulesContext.test.tsx
git commit -m "feat(rules): migrate persistence to Firestore via useFirestoreDoc"
```

---

## Task 8 — Migrate `CardsContext` to Firestore (split UI state)

**Files:**
- Modify: `src/contexts/CardsContext.tsx`
- Create: `src/contexts/CardsContext.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/contexts/CardsContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  mockDoc, mockGetDoc, mockSetDoc, mockOnSnapshotImpl, mockDocSnapshot, resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(), signOut: vi.fn(), onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})), persistentLocalCache: vi.fn(),
  doc: mockDoc, getDoc: mockGetDoc, setDoc: mockSetDoc, onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(), collection: vi.fn(), query: vi.fn(), where: vi.fn(),
  getDocs: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
  runTransaction: vi.fn(), writeBatch: vi.fn(),
  getDocFromServer: vi.fn(), connectFirestoreEmulator: vi.fn(),
}));

import { CardsProvider, useCards } from './CardsContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_CARDS } from '../domain/cards';

function Probe() {
  const { cards, selectedCardId, dispatch } = useCards();
  return (
    <div>
      <span data-testid="count">{cards.length}</span>
      <span data-testid="selected">{selectedCardId ?? 'none'}</span>
      <button data-testid="add" onClick={() => dispatch({ type: 'ADD_CARD' })}>add</button>
      <button data-testid="select" onClick={() => dispatch({ type: 'SELECT_CARD', cardId: cards[0].id })}>sel</button>
    </div>
  );
}

describe('CardsContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  it('persists only the cards array (not UI fields)', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <CardsProvider activeProjectId="p_1"><Probe /></CardsProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); });

    screen.getByTestId('add').click();
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalled();
    const [ref, payload] = mockSetDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1/design/cards');
    expect(Array.isArray(payload.cards)).toBe(true);
    expect(payload.selectedCardId).toBeUndefined();
    expect(payload.activeDeckType).toBeUndefined();
  });

  it('SELECT_CARD does not trigger a Firestore write', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { cards: DEFAULT_CARDS }));
    render(
      <SyncStatusProvider>
        <CardsProvider activeProjectId="p_1"><Probe /></CardsProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); });
    mockSetDoc.mockClear();
    screen.getByTestId('select').click();
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/CardsContext.test.tsx`

- [ ] **Step 3: Rewrite `CardsContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardType, DEFAULT_CARDS } from '../domain/cards';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

interface CardsDoc {
  cards: Card[];
}

type CardsDataAction =
  | { type: 'UPDATE_CARD'; cardId: string; field: keyof Card; value: string }
  | { type: 'ADD_CARD'; deckType: CardType }
  | { type: 'DELETE_CARD'; cardId: string };

type CardsAction =
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'UPDATE_CARD'; cardId: string; field: keyof Card; value: string }
  | { type: 'SET_ACTIVE_DECK'; deckType: CardType }
  | { type: 'ADD_CARD' }
  | { type: 'DELETE_CARD'; cardId: string };

interface CardsContextValue {
  cards: Card[];
  activeDeckType: CardType;
  selectedCardId: string | null;
  dispatch: React.Dispatch<CardsAction>;
}

const CardsContext = createContext<CardsContextValue | null>(null);

function getFirstCardId(cards: Card[], deckType: CardType): string | null {
  return cards.find((c) => c.type === deckType)?.id ?? null;
}

function cardsDataReducer(state: CardsDoc, action: CardsDataAction | RemoteSyncAction<CardsDoc>): CardsDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { cards: action.value.cards ?? [] };
    case 'UPDATE_CARD':
      return {
        cards: state.cards.map((c) => c.id === action.cardId ? { ...c, [action.field]: action.value } : c),
      };
    case 'ADD_CARD': {
      const prefix = action.deckType === 'chance' ? 'CHN' : 'COM';
      const newCard: Card = {
        id: `${prefix}-${Date.now()}`,
        title: 'NEW CARD',
        description: 'Card description.',
        type: action.deckType,
        icon: 'help',
        accentColor: action.deckType === 'chance' ? 'orange' : 'blue',
      };
      return { cards: [...state.cards, newCard] };
    }
    case 'DELETE_CARD':
      return { cards: state.cards.filter((c) => c.id !== action.cardId) };
    default:
      return state;
  }
}

interface CardsProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function CardsProvider({ children, activeProjectId }: CardsProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<CardsDoc, CardsDataAction>(
    `projects/${activeProjectId}/design/cards`,
    { defaults: { cards: DEFAULT_CARDS }, reducer: cardsDataReducer },
  );

  const [activeDeckType, setActiveDeckType] = useState<CardType>('chance');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    getFirstCardId(state.cards, 'chance'),
  );

  const { report } = useSyncStatus();
  useEffect(() => { report('cards', status); }, [status, report]);

  const dispatch: React.Dispatch<CardsAction> = (action) => {
    switch (action.type) {
      case 'SELECT_CARD':
        setSelectedCardId(action.cardId);
        return;
      case 'SET_ACTIVE_DECK':
        setActiveDeckType(action.deckType);
        setSelectedCardId(getFirstCardId(state.cards, action.deckType));
        return;
      case 'ADD_CARD': {
        dispatchData({ type: 'ADD_CARD', deckType: activeDeckType });
        // selectedCardId will be updated via effect below once state.cards changes
        return;
      }
      case 'DELETE_CARD': {
        dispatchData({ type: 'DELETE_CARD', cardId: action.cardId });
        if (selectedCardId === action.cardId) setSelectedCardId(null);
        return;
      }
      case 'UPDATE_CARD':
        dispatchData({ type: 'UPDATE_CARD', cardId: action.cardId, field: action.field, value: action.value });
        return;
    }
  };

  // Keep selectedCardId valid when cards change (e.g., after ADD_CARD, select the newest of this deck)
  useEffect(() => {
    if (selectedCardId && state.cards.some((c) => c.id === selectedCardId)) return;
    setSelectedCardId(getFirstCardId(state.cards, activeDeckType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cards]);

  return (
    <CardsContext.Provider value={{ cards: state.cards, activeDeckType, selectedCardId, dispatch }}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards(): CardsContextValue {
  const context = useContext(CardsContext);
  if (!context) throw new Error('useCards must be used within a CardsProvider');
  return context;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/CardsContext.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/CardsContext.tsx src/contexts/CardsContext.test.tsx
git commit -m "feat(cards): migrate persistence to Firestore, split UI state"
```

---

## Task 9 — Migrate `BoardContext` to Firestore

**Files:**
- Modify: `src/contexts/BoardContext.tsx`
- Create: `src/contexts/BoardContext.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/contexts/BoardContext.test.tsx` following the Cards/Rules test pattern. Key assertions:
- Persisted payload contains `tiles` but not `selectedTileId`.
- `SELECT_TILE` does not trigger a write.
- `UPDATE_TILE` writes to `projects/{pid}/design/board`.

Reuse the mock factory block from the Cards test. The Probe component:

```tsx
function Probe() {
  const { tiles, selectedTileId, dispatch } = useBoard();
  return (
    <div>
      <span data-testid="count">{tiles.length}</span>
      <span data-testid="selected">{selectedTileId ?? 'none'}</span>
      <button data-testid="select" onClick={() => dispatch({ type: 'SELECT_TILE', position: 1 })}>sel</button>
      <button data-testid="edit" onClick={() => dispatch({ type: 'UPDATE_TILE', position: 0, field: 'name', value: 'X' })}>edit</button>
    </div>
  );
}
```

Test bodies:

```tsx
it('persists only tiles (not selectedTileId)', async () => {
  mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
  render(<SyncStatusProvider><BoardProvider activeProjectId="p_1"><Probe /></BoardProvider></SyncStatusProvider>);
  await act(async () => { await Promise.resolve(); });

  screen.getByTestId('edit').click();
  await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

  expect(mockSetDoc).toHaveBeenCalled();
  const [ref, payload] = mockSetDoc.mock.calls.at(-1)!;
  expect(ref._path).toBe('projects/p_1/design/board');
  expect(Array.isArray(payload.tiles)).toBe(true);
  expect(payload.selectedTileId).toBeUndefined();
});

it('SELECT_TILE does not trigger a write', async () => {
  mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { tiles: DEFAULT_BOARD }));
  render(<SyncStatusProvider><BoardProvider activeProjectId="p_1"><Probe /></BoardProvider></SyncStatusProvider>);
  await act(async () => { await Promise.resolve(); });
  mockSetDoc.mockClear();
  screen.getByTestId('select').click();
  await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });
  expect(mockSetDoc).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/BoardContext.test.tsx`

- [ ] **Step 3: Rewrite `BoardContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Tile, RentStructure, DEFAULT_BOARD } from '../domain/board';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

interface BoardDoc {
  tiles: Tile[];
}

type BoardDataAction =
  | { type: 'UPDATE_TILE'; position: number; field: string; value: unknown }
  | { type: 'UPDATE_RENT'; position: number; field: keyof RentStructure; value: number };

type BoardAction =
  | { type: 'SELECT_TILE'; position: number }
  | BoardDataAction;

interface BoardContextValue {
  tiles: Tile[];
  selectedTileId: number | null;
  dispatch: React.Dispatch<BoardAction>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

function boardDataReducer(state: BoardDoc, action: BoardDataAction | RemoteSyncAction<BoardDoc>): BoardDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { tiles: action.value.tiles ?? [] };
    case 'UPDATE_TILE':
      return {
        tiles: state.tiles.map((t) => t.position === action.position ? { ...t, [action.field]: action.value } : t),
      };
    case 'UPDATE_RENT':
      return {
        tiles: state.tiles.map((t) => t.position === action.position && t.rent
          ? { ...t, rent: { ...t.rent, [action.field]: action.value } }
          : t),
      };
    default:
      return state;
  }
}

interface BoardProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function BoardProvider({ children, activeProjectId }: BoardProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<BoardDoc, BoardDataAction>(
    `projects/${activeProjectId}/design/board`,
    { defaults: { tiles: DEFAULT_BOARD }, reducer: boardDataReducer },
  );

  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const { report } = useSyncStatus();
  useEffect(() => { report('board', status); }, [status, report]);

  const dispatch: React.Dispatch<BoardAction> = (action) => {
    if (action.type === 'SELECT_TILE') {
      setSelectedTileId(action.position);
      return;
    }
    dispatchData(action);
  };

  return (
    <BoardContext.Provider value={{ tiles: state.tiles, selectedTileId, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within a BoardProvider');
  return context;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/contexts/BoardContext.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/contexts/BoardContext.tsx src/contexts/BoardContext.test.tsx
git commit -m "feat(board): migrate persistence to Firestore"
```

---

## Task 10 — Migrate `TokensContext` to Firestore

**Files:**
- Modify: `src/contexts/TokensContext.tsx`
- Create: `src/contexts/TokensContext.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/contexts/TokensContext.test.tsx` in the same shape as Cards. Key assertions:
- Persisted payload contains `tokens` but not `selectedTokenId` / `activeCategory`.
- `SELECT_TOKEN` and `SET_CATEGORY` do not trigger writes.
- `UPDATE_TOKEN` writes to `projects/{pid}/design/tokens`.

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/contexts/TokensContext.test.tsx`

- [ ] **Step 3: Rewrite `TokensContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Token, TokenCategory, DEFAULT_TOKENS } from '../domain/tokens';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

type CategoryFilter = TokenCategory | 'all';

interface TokensDoc {
  tokens: Token[];
}

type TokensDataAction =
  | { type: 'UPDATE_TOKEN'; tokenId: string; field: keyof Token; value: unknown }
  | { type: 'ADD_TOKEN'; category: TokenCategory }
  | { type: 'DELETE_TOKEN'; tokenId: string };

type TokensAction =
  | { type: 'SELECT_TOKEN'; tokenId: string }
  | { type: 'SET_CATEGORY'; category: CategoryFilter }
  | { type: 'UPDATE_TOKEN'; tokenId: string; field: keyof Token; value: unknown }
  | { type: 'ADD_TOKEN' }
  | { type: 'DELETE_TOKEN'; tokenId: string };

interface TokensContextValue {
  tokens: Token[];
  activeCategory: CategoryFilter;
  selectedTokenId: string | null;
  dispatch: React.Dispatch<TokensAction>;
}

const TokensContext = createContext<TokensContextValue | null>(null);

function getFirstTokenId(tokens: Token[], category: CategoryFilter): string | null {
  const first = category === 'all' ? tokens[0] : tokens.find((t) => t.category === category);
  return first?.id ?? null;
}

function tokensDataReducer(state: TokensDoc, action: TokensDataAction | RemoteSyncAction<TokensDoc>): TokensDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { tokens: action.value.tokens ?? [] };
    case 'UPDATE_TOKEN':
      return {
        tokens: state.tokens.map((t) => t.id === action.tokenId ? { ...t, [action.field]: action.value } : t),
      };
    case 'ADD_TOKEN': {
      const newToken: Token = {
        id: `token-${Date.now()}`,
        name: 'New Token',
        category: action.category,
        icon: 'help',
        description: 'A new game token.',
        quantity: 1,
      };
      return { tokens: [...state.tokens, newToken] };
    }
    case 'DELETE_TOKEN':
      return { tokens: state.tokens.filter((t) => t.id !== action.tokenId) };
    default:
      return state;
  }
}

interface TokensProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function TokensProvider({ children, activeProjectId }: TokensProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<TokensDoc, TokensDataAction>(
    `projects/${activeProjectId}/design/tokens`,
    { defaults: { tokens: DEFAULT_TOKENS }, reducer: tokensDataReducer },
  );

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(state.tokens[0]?.id ?? null);
  const { report } = useSyncStatus();
  useEffect(() => { report('tokens', status); }, [status, report]);

  const dispatch: React.Dispatch<TokensAction> = (action) => {
    switch (action.type) {
      case 'SELECT_TOKEN':
        setSelectedTokenId(action.tokenId);
        return;
      case 'SET_CATEGORY':
        setActiveCategory(action.category);
        setSelectedTokenId(getFirstTokenId(state.tokens, action.category));
        return;
      case 'ADD_TOKEN': {
        const cat: TokenCategory = activeCategory === 'all' ? 'pawn' : activeCategory;
        dispatchData({ type: 'ADD_TOKEN', category: cat });
        return;
      }
      case 'DELETE_TOKEN':
        dispatchData({ type: 'DELETE_TOKEN', tokenId: action.tokenId });
        if (selectedTokenId === action.tokenId) setSelectedTokenId(null);
        return;
      case 'UPDATE_TOKEN':
        dispatchData(action);
        return;
    }
  };

  useEffect(() => {
    if (selectedTokenId && state.tokens.some((t) => t.id === selectedTokenId)) return;
    setSelectedTokenId(getFirstTokenId(state.tokens, activeCategory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tokens]);

  return (
    <TokensContext.Provider value={{ tokens: state.tokens, activeCategory, selectedTokenId, dispatch }}>
      {children}
    </TokensContext.Provider>
  );
}

export function useTokens(): TokensContextValue {
  const context = useContext(TokensContext);
  if (!context) throw new Error('useTokens must be used within a TokensProvider');
  return context;
}
```

- [ ] **Step 2: Run — expect PASS**

Run: `npx vitest run src/contexts/TokensContext.test.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/contexts/TokensContext.tsx src/contexts/TokensContext.test.tsx
git commit -m "feat(tokens): migrate persistence to Firestore"
```

---

## Task 11 — `ActiveProjectRoot` and `SaveIndicator`

**Files:**
- Create: `src/components/ActiveProjectRoot.tsx`
- Create: `src/components/SaveIndicator.tsx`
- Test: `src/components/SaveIndicator.test.tsx`

Implements `Requirement: Active project remounts design providers` (wrapper side) and `Requirement: SaveIndicator UI component`.

- [ ] **Step 1: Write failing test for SaveIndicator**

Create `src/components/SaveIndicator.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SyncStatusProvider, useSyncStatus } from '../contexts/SyncStatusContext';
import SaveIndicator from './SaveIndicator';

function Trigger({ onReport }: { onReport: (r: any) => void }) {
  const { report } = useSyncStatus();
  onReport(report);
  return null;
}

function setup() {
  let reporter!: any;
  render(
    <SyncStatusProvider>
      <Trigger onReport={(r) => (reporter = r)} />
      <SaveIndicator />
    </SyncStatusProvider>,
  );
  return () => reporter;
}

describe('SaveIndicator', () => {
  it('renders nothing (or idle-blank) when all idle', () => {
    setup();
    expect(screen.queryByText(/Saving/)).toBeNull();
    expect(screen.queryByText(/Saved just now/)).toBeNull();
  });

  it('renders "Saving…" when any domain saving', () => {
    const report = setup();
    act(() => { report()('rules', 'saving'); });
    expect(screen.getByText(/Saving/)).toBeInTheDocument();
  });

  it('renders "Saved just now" when a recent save landed', () => {
    const report = setup();
    act(() => { report()('cards', 'saved'); });
    expect(screen.getByText(/Saved just now/)).toBeInTheDocument();
  });

  it('renders an error state when any domain errored', () => {
    const report = setup();
    act(() => { report()('board', 'error'); });
    expect(screen.getByText(/Error/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/SaveIndicator.test.tsx`

- [ ] **Step 3: Implement SaveIndicator**

Create `src/components/SaveIndicator.tsx`:

```tsx
import React from 'react';
import { useAggregateStatus } from '../contexts/SyncStatusContext';

export default function SaveIndicator() {
  const status = useAggregateStatus();
  if (status === 'idle') return null;
  const base = 'text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full';

  if (status === 'saving') {
    return <span className={`${base} bg-surface-container-high text-on-surface-variant`}>Saving…</span>;
  }
  if (status === 'saved') {
    return <span className={`${base} bg-primary/10 text-primary`}>Saved just now</span>;
  }
  return <span className={`${base} bg-error/20 text-error`}>Error — retry coming up</span>;
}
```

- [ ] **Step 4: Implement ActiveProjectRoot**

Create `src/components/ActiveProjectRoot.tsx`:

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function ActiveProjectRoot({ children }: Props) {
  return <>{children}</>;
}
```

(This is a deliberately trivial component — its value is being remounted via `key={activeProjectId}` in `App.tsx`.)

- [ ] **Step 5: Run — expect PASS**

Run: `npx vitest run src/components/SaveIndicator.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add src/components/SaveIndicator.tsx src/components/SaveIndicator.test.tsx src/components/ActiveProjectRoot.tsx
git commit -m "feat(ui): SaveIndicator and ActiveProjectRoot wrapper"
```

---

## Task 12 — `ProjectListScreen`

**Files:**
- Create: `src/components/ProjectListScreen.tsx`
- Test: `src/components/ProjectListScreen.test.tsx`

Implements `Requirement: ProjectListScreen UI`.

- [ ] **Step 1: Write failing test**

Create `src/components/ProjectListScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectListScreen from './ProjectListScreen';

function setup(override?: Partial<any>) {
  const createProject = vi.fn().mockResolvedValue('p_new');
  const renameProject = vi.fn().mockResolvedValue(undefined);
  const deleteProject = vi.fn().mockResolvedValue(undefined);
  const openProject = vi.fn().mockResolvedValue(undefined);
  const projects = override?.projects ?? [
    { id: 'p_1', name: 'First', ownerId: 'uid_A', updatedAt: null },
    { id: 'p_2', name: 'Second', ownerId: 'uid_A', updatedAt: null },
  ];
  render(<ProjectListScreen
    projects={projects}
    createProject={createProject}
    renameProject={renameProject}
    deleteProject={deleteProject}
    openProject={openProject}
  />);
  return { createProject, renameProject, deleteProject, openProject };
}

describe('ProjectListScreen', () => {
  it('renders one card per project', () => {
    setup();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls openProject when a card is clicked', () => {
    const { openProject } = setup();
    fireEvent.click(screen.getByRole('button', { name: /open First/i }));
    expect(openProject).toHaveBeenCalledWith('p_1');
  });

  it('prompts for a name and calls createProject', () => {
    const { createProject } = setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Fresh Project');
    fireEvent.click(screen.getByRole('button', { name: /New project/i }));
    expect(createProject).toHaveBeenCalledWith('Fresh Project');
    promptSpy.mockRestore();
  });

  it('confirms before deleting', () => {
    const { deleteProject } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);
    expect(deleteProject).toHaveBeenCalledWith('p_1');
    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is declined', () => {
    const { deleteProject } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);
    expect(deleteProject).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('shows empty state when no projects', () => {
    setup({ projects: [] });
    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/ProjectListScreen.test.tsx`

- [ ] **Step 3: Implement**

Create `src/components/ProjectListScreen.tsx`:

```tsx
import React from 'react';
import type { ProjectMeta } from '../contexts/ProjectContext';

interface Props {
  projects: ProjectMeta[];
  createProject: (name: string) => Promise<string>;
  renameProject: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
}

export default function ProjectListScreen({
  projects, createProject, renameProject, deleteProject, openProject,
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
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-surface-container rounded-xl border border-outline-variant/50 p-4 flex flex-col gap-3"
            >
              <button
                aria-label={`Open ${p.name}`}
                onClick={() => openProject(p.id)}
                className="text-left"
              >
                <h3 className="text-lg font-bold text-on-surface">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-on-surface-variant mt-1">{p.description}</p>
                )}
              </button>
              <div className="flex gap-2 mt-auto pt-3 border-t border-outline-variant/40">
                <button
                  onClick={() => handleRename(p.id, p.name)}
                  className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/components/ProjectListScreen.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectListScreen.tsx src/components/ProjectListScreen.test.tsx
git commit -m "feat(ui): ProjectListScreen with open/rename/delete/new"
```

---

## Task 13 — `App.tsx` routing + `Layout` nav + provider nesting

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

Implements `Requirement: Screen navigation includes projects`, `Requirement: ProjectProvider exposes project list and active project`, `Requirement: Active project remounts design providers`, `Requirement: Closing the active project returns to list`.

- [ ] **Step 1: Update `App.tsx`**

```tsx
import React, { useState } from 'react';
import { Screen } from './types';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import RulesEditor from './components/RulesEditor';
import Library from './components/Library';
import BoardEditor from './components/BoardEditor';
import CardDesigner from './components/CardDesigner';
import Settings from './components/Settings';
import TokensEditor from './components/TokensEditor';
import ProjectListScreen from './components/ProjectListScreen';
import ActiveProjectRoot from './components/ActiveProjectRoot';
import { RulesProvider } from './contexts/RulesContext';
import { CardsProvider } from './contexts/CardsContext';
import { BoardProvider } from './contexts/BoardContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { TokensProvider } from './contexts/TokensContext';
import { ProjectProvider, useProjects } from './contexts/ProjectContext';
import { SyncStatusProvider } from './contexts/SyncStatusContext';

function AuthedApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>('rules');
  const { projects, activeProjectId, loading, createProject, renameProject, deleteProject, openProject, closeActive } = useProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const showList = activeProjectId === null || activeScreen === 'projects';

  const handleScreenChange = (s: Screen) => {
    if (s === 'projects') {
      closeActive();
      setActiveScreen('projects');
    } else {
      setActiveScreen(s);
    }
  };

  if (showList) {
    return (
      <Layout activeScreen="projects" onScreenChange={handleScreenChange}>
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
        />
      </Layout>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'board': return <BoardEditor />;
      case 'cards': return <CardDesigner />;
      case 'rules': return <RulesEditor />;
      case 'library': return <Library />;
      case 'settings': return <Settings />;
      case 'tokens': return <TokensEditor />;
      default: return <RulesEditor />;
    }
  };

  return (
    <ActiveProjectRoot key={activeProjectId!}>
      <RulesProvider activeProjectId={activeProjectId!}>
        <CardsProvider activeProjectId={activeProjectId!}>
          <BoardProvider activeProjectId={activeProjectId!}>
            <TokensProvider activeProjectId={activeProjectId!}>
              <Layout activeScreen={activeScreen} onScreenChange={handleScreenChange}>
                {renderScreen()}
              </Layout>
            </TokensProvider>
          </BoardProvider>
        </CardsProvider>
      </RulesProvider>
    </ActiveProjectRoot>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <LoginScreen />;

  return (
    <LibraryProvider>
      <SyncStatusProvider>
        <ProjectProvider>
          <AuthedApp />
        </ProjectProvider>
      </SyncStatusProvider>
    </LibraryProvider>
  );
}
```

- [ ] **Step 2: Update `Layout.tsx`**

Two changes: (a) add `Projects` nav item, (b) mount `<SaveIndicator />` in the header when not on the list screen.

In `src/components/Layout.tsx`:

```tsx
// at the top imports:
import SaveIndicator from './SaveIndicator';

// in navItems array, add as the first item:
const navItems: { id: Screen; icon: string; label: string }[] = [
  { id: 'projects', icon: 'folder_open', label: 'Projects' },
  { id: 'board', icon: 'grid_view', label: 'Board' },
  { id: 'cards', icon: 'style', label: 'Cards' },
  { id: 'rules', icon: 'gavel', label: 'Rules' },
  { id: 'tokens', icon: 'token', label: 'Tokens' },
  { id: 'library', icon: 'layers', label: 'Library' },
];

// in the top nav flex div (between settings and avatar), insert:
<div className="hidden md:flex items-center mr-2">
  {activeScreen !== 'projects' && <SaveIndicator />}
</div>
```

- [ ] **Step 3: Run — tests and lint**

Run: `npm run test && npm run lint`
Expected: all green. Some existing component tests may need re-rendering with providers — address any failures by wrapping in providers as the failing test indicates.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat(app): route to ProjectListScreen, wrap providers in ActiveProjectRoot"
```

---

## Task 14 — Update seed script for projects

**Files:**
- Modify: `scripts/seed-emulator.ts`

- [ ] **Step 1: Rewrite seed script**

Replace the file body with:

```ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'fiery-splice-321104' });
const db = getFirestore(app);

async function seed() {
  console.log('Seeding Firestore emulator...');

  const uid = 'test-user-001';
  const projectId = 'p_demo';

  await db.doc(`users/${uid}/profile/main`).set({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    lastOpenedProjectId: projectId,
  });
  console.log('  ✓ User profile (with lastOpenedProjectId)');

  await db.doc(`users/${uid}/settings/preferences`).set({
    language: 'en', theme: 'dark',
    autosave: true, gridSnap: true, highPerformance: false,
    updatedAt: new Date(),
  });
  console.log('  ✓ User settings');

  await db.doc(`projects/${projectId}`).set({
    id: projectId,
    ownerId: uid,
    members: { [uid]: 'owner' },
    name: 'Demo Project',
    description: 'Seeded demo for local development.',
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  });
  await db.doc(`users/${uid}/projectRefs/${projectId}`).set({
    role: 'owner',
    addedAt: new Date(),
    lastOpenedAt: new Date(),
  });
  console.log('  ✓ Project + projectRef');

  // Seed design subdocs using the DEFAULT_* values structure
  await db.doc(`projects/${projectId}/design/board`).set({
    tiles: [
      { position: 0, name: 'GO', tileType: 'go', icon: 'arrow_back', effect: { type: 'collectSalary', amount: 200 } },
      { position: 1, name: 'Mediterranean Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 2, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 } },
    ],
  });
  await db.doc(`projects/${projectId}/design/cards`).set({
    cards: [
      { id: 'CHN-004', title: 'ADVANCE TO GO', description: 'Collect $200 salary as you pass through start.', type: 'chance', icon: 'rocket_launch', accentColor: 'orange' },
      { id: 'COM-001', title: 'BANK ERROR IN YOUR FAVOR', description: 'Collect $200.', type: 'community-chest', icon: 'payments', accentColor: 'blue' },
    ],
  });
  await db.doc(`projects/${projectId}/design/rules`).set({
    economy: { startingCash: 1500, salary: 200 },
    players: { minPlayers: 2, maxPlayers: 8, allowAI: true, spectatorMode: false },
    mechanics: { doubleRentOnSets: true, mandatoryAuctions: true, instantBankruptcy: false },
    auction: { startingBid: 10, bidIncrement: '$10 Scaled', timerDuration: '30 Seconds' },
  });
  await db.doc(`projects/${projectId}/design/tokens`).set({
    tokens: [
      { id: 'pawn-1', name: 'Top Hat', category: 'pawn', icon: 'checkroom', description: "Classic gentleman's top hat piece.", quantity: 1 },
      { id: 'dice-1', name: 'Standard D6', category: 'dice', icon: 'casino', description: 'Standard six-sided die.', quantity: 2, sides: 6 },
    ],
  });
  console.log('  ✓ Design subdocs (board, cards, rules, tokens)');

  console.log('\nDone! View data at http://localhost:4000/firestore');
  console.log(`Log in as ${uid} in the emulator Auth tab, then reload the app.`);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
```

- [ ] **Step 2: Verify the seed**

Run (emulator should already be running):

```bash
npm run emulator:seed
```

Expected output: all `✓` lines. Open `http://localhost:4000/firestore` and confirm `projects/p_demo` with its `design/*` children and `users/test-user-001/projectRefs/p_demo` exist.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-emulator.ts
git commit -m "chore(emulator): seed a demo project with design subdocs"
```

---

## Task 15 — Cleanup + documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `openspec/domain-model.md`

Implements `Requirement: Removed localStorage requirements` (the cleanup half — the code no longer calls `loadState`/`saveState` for the four domains after Tasks 7–10).

`src/lib/storage.ts` stays in place for `LibraryContext`. No code to delete.

- [ ] **Step 1: Verify no stale localStorage references remain**

Run (via Grep tool, not shell):

```
Grep for pattern "gamecraft:(rules|cards|board|tokens)" across src/
```

Expected: zero matches. If any appear (e.g., in a leftover test), remove them.

- [ ] **Step 2: Update `CLAUDE.md`**

In the "Provider nesting order" section, replace the paragraph with:

```md
### Provider nesting order

Providers wrap in `main.tsx` / `App.tsx` in this order (outermost first):
`AuthProvider` > `ThemeProvider` > `LibraryProvider` > `SyncStatusProvider` > `ProjectProvider` > `ActiveProjectRoot` (keyed by `activeProjectId`) > `RulesProvider` > `CardsProvider` > `BoardProvider` > `TokensProvider`.

Auth and Theme are in `main.tsx`; the rest in `App.tsx`. `LibraryProvider` is outside `ProjectProvider` because Library is cross-project.
```

In "Key conventions > State persistence", replace with:

```md
- **State persistence:** The four design domains (Rules, Cards, Board, Tokens) persist to Firestore under `projects/{activeProjectId}/design/*` via the shared `useFirestoreDoc` hook (`src/hooks/useFirestoreDoc.ts`) — optimistic local state, 500 ms debounced writes, `onSnapshot` last-write-wins. `LibraryContext` still uses `loadState`/`saveState` from `src/lib/storage.ts` (key `gamecraft:library`). No other localStorage usage remains for design data.
```

- [ ] **Step 3: Update `openspec/domain-model.md`**

Find the `### Project` block and replace its status line:

```md
> Status: implemented (Phase 1). Stored at `projects/{projectId}` with reverse index `users/{uid}/projectRefs/{projectId}`. Managed via `ProjectContext` / `ProjectListScreen`. Design domains persist to `projects/{projectId}/design/{board|cards|rules|tokens}`.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md openspec/domain-model.md
git commit -m "docs: update CLAUDE.md and domain-model.md for Project Phase 1"
```

---

## Task 16 — Verification

Implements Section 10 of `tasks.md`.

- [ ] **Step 1: Lint + full test suite**

Run: `npm run lint && npm run test`
Expected: `tsc --noEmit` clean, all vitest suites green.

- [ ] **Step 2: Start emulator + dev server (two terminals)**

```bash
npm run emulator:start       # terminal 1 — already running from Task 3
npm run emulator:seed        # terminal 2, once
npm run dev:emu              # terminal 2
```

Expected: app loads at `http://localhost:3000` with emulator-backed auth/Firestore.

- [ ] **Step 3: Manual scenario — first-login auto-provisioning**

1. Sign in via the emulator Auth (create a new account).
2. App should land directly in the Rules editor with `activeProjectId` set (check Firestore UI for the new `projects/*` doc).
3. Edit the salary field → `Saving…` pill appears in header, then `Saved just now`.
4. In `http://localhost:4000/firestore`, confirm `projects/{…}/design/rules.economy.salary` reflects the edit.

- [ ] **Step 4: Manual scenario — multi-project switching**

1. Click the `Projects` nav item → lands on list.
2. Click `New project`, enter name → lands back in Rules editor for the new project.
3. Verify the new project has its own `design/*` docs (created on first edit).
4. Click `Projects`, open the previous project → editor state resets (e.g., open a different tile, switch, come back).

- [ ] **Step 5: Manual scenario — last-write-wins across tabs**

1. Open a second browser tab at `http://localhost:3000`.
2. Sign in with the same account, open the same project.
3. Edit the salary in tab A; wait a second; verify tab B updates via `onSnapshot`.
4. Edit in B; wait; A updates.

- [ ] **Step 6: Manual scenario — offline editing**

1. In DevTools → Network → throttle to "Offline".
2. Edit a field. `Saving…` may stay on; offline queue absorbs writes.
3. Flip back to online. Writes flush; indicator returns to `Saved just now`.

- [ ] **Step 7: Manual scenario — last-opened memory**

1. Log out; log back in → land in the last project edited.
2. Delete that project; log out; log back in → `ProjectListScreen` renders.

- [ ] **Step 8: Manual scenario — security rules enforcement**

In the Emulator Rules Playground (Task 3 scenarios repeated as a sanity check):
- owner read/write on `projects/{pid}` ✅
- non-member read on `projects/{pid}` ❌
- non-member read on `users/{otherUid}/projectRefs/{pid}` ❌

- [ ] **Step 9: Commit any test-fixture adjustments made during verification**

```bash
git status   # review
git add -- <specific-files>
git commit -m "chore: verification-phase adjustments"
```

(Skip if nothing changed.)

---

## Spec Coverage Crosswalk (self-review)

| Spec Requirement | Implemented in |
|---|---|
| Project domain type | Task 1 |
| Projects stored at top-level Firestore collection | Task 6 (create) |
| Per-user reverse index of projects | Task 6 (create) |
| Project create is transactional | Task 6 (create) |
| Project delete is transactional | Task 6 (delete) |
| ProjectContext exposes project list and active project | Task 6 |
| Open a project sets it as active | Task 6 (openProject) |
| Closing the active project returns to list | Task 6 (closeActive) + Task 13 (`handleScreenChange`) |
| Rename a project | Task 6 (renameProject) |
| ProjectListScreen UI | Task 12 |
| Active project remounts design providers | Task 13 (`<ActiveProjectRoot key=…>`) |
| Last-opened project memory on profile | Task 6 (hydrate) + Task 6 (openProject write) |
| First-login auto-provisioning | Task 6 |
| Screen navigation includes projects | Task 1 (union) + Task 13 (Layout nav) |
| Security rules for projects collection | Task 3 |
| Security rules for design subcollection | Task 3 |
| Security rules for projectRefs | Task 3 |
| Membership primitive extensible to Phase 2 | Task 3 (`isMember`) |
| Firestore offline persistence enabled | Task 2 |
| useFirestoreDoc shared sync hook | Task 4 |
| Domain contexts persist to Firestore | Tasks 7–10 |
| SaveIndicator UI component | Task 11 + Task 5 (aggregation) |
| Last-write-wins merge across tabs | Task 4 |
| Sync aligns to active project boundary | Task 13 (remount via key) |
| Profile carries optional lastOpenedProjectId | Task 2 (merge branch) + Task 6 (openProject) |
| User profile created on first sign-in (modified) | Task 2 |
| User profile updated on subsequent sign-ins (modified) | Task 2 (already merges; test strengthened) |
| Removed Rules/Cards/Board/Tokens localStorage requirements | Tasks 7–10 + Task 15 (docs) |

No gaps identified.

---

## Rollback / Safety Notes

- Every task commits separately. Reverting any single task (except Task 2 — enables persistent cache) leaves the tree buildable.
- Task 2's `initializeFirestore(..., persistentLocalCache())` is not destructive: if it breaks under an edge-case SDK version mismatch, fall back to plain `getFirestore(app, firestoreDatabaseId)` — the rest of the plan doesn't depend on offline cache being enabled (the hook's optimistic local state compensates).
- `firestore.rules` change is live-applied by the emulator; in production, deploy via the existing Firebase pipeline (not part of this plan).
- No data migration runs against existing localStorage — per `design.md` §10, this is intentional.
