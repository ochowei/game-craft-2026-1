import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
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
  mockOnAuthStateChanged,
  createMockUser,
  emitAuthState,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: mockOnAuthStateChanged,
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(),
  doc: mockDoc,
  collection: mockCollection,
  query: (ref: any) => ref,
  where: vi.fn((f: string, o: string, v: any) => ({ f, o, v })),
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction,
  writeBatch: mockWriteBatch,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(() => ({ _type: 'ts' })),
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
    // First getDocs call on projectRefs: empty
    mockGetDocs.mockResolvedValueOnce({ docs: [], empty: true });
    // Second getDocs call (after provisioning) returns the new ref
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_auto', data: () => ({ role: 'owner' }) }],
      empty: false,
    });

    // Profile (lastOpenedProjectId not set) — though flow skips profile read in auto-provision branch
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path?.startsWith('projects/')) {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'My First Project',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 0 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });

    const txnSet = vi.fn();
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      await fn({ set: txnSet, get: vi.fn().mockResolvedValue(mockDocSnapshot(false)) });
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).not.toBe(null));
    expect(mockRunTransaction).toHaveBeenCalled();
    // 2 sets inside the transaction: projects/{pid} + projectRefs/{pid}
    expect(txnSet).toHaveBeenCalledTimes(2);
  });

  it('hydrates activeProjectId from profile.lastOpenedProjectId when valid', async () => {
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
          name: 'First',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
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
      if (ref._path === 'projects/p_1') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'Live',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      // projects/p_old does not exist — not in list; hydration should clear
      return Promise.resolve(mockDocSnapshot(false));
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeProjectId).toBe(null);
    const profileClearCall = mockSetDoc.mock.calls.find(
      ([ref, data]: any[]) => ref._path?.endsWith('/profile/main') && data.lastOpenedProjectId === null,
    );
    expect(profileClearCall).toBeTruthy();
  });

  it('createProject writes project + projectRefs transactionally', async () => {
    // Existing user with one project so auto-provisioning skips
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'p_existing', data: () => ({ role: 'owner' }) }],
      empty: false,
    });
    mockGetDoc.mockImplementation((ref: any) => {
      if (ref._path?.endsWith('/profile/main')) return Promise.resolve(mockDocSnapshot(true, {}));
      if (ref._path === 'projects/p_existing') {
        return Promise.resolve(mockDocSnapshot(true, {
          name: 'E',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });

    const txnSet = vi.fn();
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      await fn({ set: txnSet, get: vi.fn().mockResolvedValue(mockDocSnapshot(false)) });
    });
    // After create, project list reloads
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'p_existing', data: () => ({ role: 'owner' }) },
        { id: 'p_new', data: () => ({ role: 'owner' }) },
      ],
      empty: false,
    });

    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let newId = '';
    await act(async () => { newId = await result.current.createProject('Side Quest'); });
    expect(newId.length).toBeGreaterThan(0);
    expect(txnSet).toHaveBeenCalledTimes(2);
    const [firstSetCall, secondSetCall] = txnSet.mock.calls;
    expect(firstSetCall[0]._path).toMatch(/^projects\//);
    expect(secondSetCall[0]._path).toMatch(/^users\/uid_A\/projectRefs\//);
  });

  it('deleteProject runs a transaction and clears activeProjectId when deleting active', async () => {
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
          name: 'X',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
        }));
      }
      return Promise.resolve(mockDocSnapshot(false));
    });
    const txnDelete = vi.fn();
    mockRunTransaction.mockImplementation(async (_db: any, fn: any) => {
      await fn({ delete: txnDelete, get: vi.fn() });
    });
    const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    mockWriteBatch.mockReturnValue(batch);

    // After delete, reload projects returns empty
    const { result } = renderHook(() => useProjects(), { wrapper: Wrapper });
    act(() => { emitAuthState(createMockUser({ uid: 'uid_A' })); });
    await waitFor(() => expect(result.current.activeProjectId).toBe('p_1'));

    // The post-delete reload:
    mockGetDocs.mockResolvedValueOnce({ docs: [], empty: true });
    // Best-effort design cleanup:
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ ref: { _path: 'projects/p_1/design/board' } }],
      empty: false,
    });

    await act(async () => { await result.current.deleteProject('p_1'); });
    expect(txnDelete).toHaveBeenCalledTimes(2);
    expect(result.current.activeProjectId).toBe(null);
  });

  it('openProject updates activeProjectId and writes lastOpenedProjectId on the profile', async () => {
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
          name: ref._path,
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
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
    const profileCall = mockSetDoc.mock.calls.find(
      ([ref]: any[]) => ref._path?.endsWith('/profile/main'),
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
          name: 'Old',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
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
          name: 'X',
          ownerId: 'uid_A',
          members: { uid_A: 'owner' },
          updatedAt: { toMillis: () => 1 },
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
