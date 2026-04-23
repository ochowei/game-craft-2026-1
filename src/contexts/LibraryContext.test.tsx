import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  mockDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockCollection,
  mockOnSnapshotImpl,
  mockWriteBatch,
  emitCollectionSnapshot,
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
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: vi.fn(),
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  collection: mockCollection,
  collectionGroup: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(() => ({ _type: 'ts' })),
  updateDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: mockWriteBatch,
  connectFirestoreEmulator: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue(undefined),
}));

const mockAuthContext = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

import { LibraryProvider, useLibrary } from './LibraryContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_LIBRARY } from '../domain/library';

function Probe() {
  const { items, activeFilter, dispatch } = useLibrary();
  return (
    <div>
      <span data-testid="count">{items.length}</span>
      <span data-testid="filter">{activeFilter}</span>
      <button
        data-testid="add"
        onClick={() =>
          dispatch({
            type: 'ADD_ITEM',
            item: {
              id: 'added',
              name: 'Added',
              itemType: 'card-template',
              description: '',
              createdAt: '2026-04-23T00:00:00Z',
              data: { title: 't', description: 'd', icon: 'i', accentColor: 'red' },
            },
          })
        }
      >add</button>
      <button
        data-testid="remove"
        onClick={() => dispatch({ type: 'REMOVE_ITEM', itemId: 'seed-card-1' })}
      >remove</button>
      <button
        data-testid="filter-palettes"
        onClick={() => dispatch({ type: 'SET_FILTER', filter: 'color-palette' })}
      >filter</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <SyncStatusProvider>
      <LibraryProvider><Probe /></LibraryProvider>
    </SyncStatusProvider>,
  );
}

describe('LibraryContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockAuthContext.user = { uid: 'uid_A' };
    mockWriteBatch.mockReturnValue({
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('exposes empty items and no-op dispatch when not signed in', async () => {
    mockAuthContext.user = null;
    renderWithProviders();
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(mockOnSnapshotImpl).not.toHaveBeenCalled();

    await act(async () => { screen.getByTestId('add').click(); });
    expect(mockSetDoc).not.toHaveBeenCalled();
    await act(async () => { screen.getByTestId('remove').click(); });
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('subscribes to users/{uid}/library for signed-in users', async () => {
    renderWithProviders();
    await act(async () => { await Promise.resolve(); });

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users/uid_A/library');
    expect(mockOnSnapshotImpl).toHaveBeenCalled();
  });

  it('ADD_ITEM dispatch writes to Firestore via setDoc', async () => {
    renderWithProviders();
    await act(async () => { await Promise.resolve(); });
    act(() => { emitCollectionSnapshot('users/uid_A/library', [{ id: 'x', data: { name: 'X' } }]); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('add').click(); });

    expect(mockSetDoc).toHaveBeenCalledOnce();
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/uid_A/library', 'added');
    expect(mockSetDoc.mock.calls[0][1].id).toBe('added');
  });

  it('REMOVE_ITEM dispatch calls deleteDoc at the correct path', async () => {
    renderWithProviders();
    await act(async () => { await Promise.resolve(); });
    act(() => { emitCollectionSnapshot('users/uid_A/library', [{ id: 'seed-card-1', data: { name: 'X' } }]); });

    await act(async () => { screen.getByTestId('remove').click(); });

    expect(mockDeleteDoc).toHaveBeenCalledOnce();
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/uid_A/library', 'seed-card-1');
  });

  it('SET_FILTER changes activeFilter without Firestore calls', async () => {
    renderWithProviders();
    await act(async () => { await Promise.resolve(); });
    act(() => { emitCollectionSnapshot('users/uid_A/library', []); });
    mockSetDoc.mockClear();
    mockDeleteDoc.mockClear();

    await act(async () => { screen.getByTestId('filter-palettes').click(); });

    expect(screen.getByTestId('filter').textContent).toBe('color-palette');
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('seeds DEFAULT_LIBRARY via writeBatch when first snapshot is empty', async () => {
    const batchSet = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set: batchSet, delete: vi.fn(), commit: batchCommit });

    renderWithProviders();
    await act(async () => { await Promise.resolve(); });

    act(() => { emitCollectionSnapshot('users/uid_A/library', []); });
    await act(async () => { await Promise.resolve(); });

    expect(mockWriteBatch).toHaveBeenCalledOnce();
    expect(batchSet).toHaveBeenCalledTimes(DEFAULT_LIBRARY.length);
    expect(batchCommit).toHaveBeenCalledOnce();
  });

  it('does NOT seed when first snapshot has items', async () => {
    const batchSet = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set: batchSet, delete: vi.fn(), commit: batchCommit });

    renderWithProviders();
    await act(async () => { await Promise.resolve(); });

    act(() => {
      emitCollectionSnapshot('users/uid_A/library', [
        { id: 'existing', data: { name: 'X', itemType: 'card-template' } },
      ]);
    });
    await act(async () => { await Promise.resolve(); });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(batchSet).not.toHaveBeenCalled();
    expect(batchCommit).not.toHaveBeenCalled();
  });

  it('does NOT re-seed on subsequent empty snapshots after first', async () => {
    const batchSet = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set: batchSet, delete: vi.fn(), commit: batchCommit });

    renderWithProviders();
    await act(async () => { await Promise.resolve(); });

    // First empty snapshot triggers seed
    act(() => { emitCollectionSnapshot('users/uid_A/library', []); });
    await act(async () => { await Promise.resolve(); });
    expect(mockWriteBatch).toHaveBeenCalledTimes(1);

    // Second empty snapshot must NOT re-trigger
    act(() => { emitCollectionSnapshot('users/uid_A/library', []); });
    await act(async () => { await Promise.resolve(); });
    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
  });
});
