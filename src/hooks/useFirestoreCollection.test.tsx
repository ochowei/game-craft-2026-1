import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  mockDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockCollection,
  mockOnSnapshotImpl,
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
  writeBatch: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue(undefined),
}));

import { useFirestoreCollection } from './useFirestoreCollection';

type Item = { id: string; name: string; value: number };

describe('useFirestoreCollection', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty items and does nothing when path is null', async () => {
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>(null, { idField: 'id' }),
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.items).toEqual([]);
    expect(result.current.hydrated).toBe(false);
    expect(mockOnSnapshotImpl).not.toHaveBeenCalled();

    // Mutations should short-circuit
    await act(async () => {
      await result.current.addItem({ id: 'x', name: 'X', value: 1 });
    });
    expect(mockSetDoc).not.toHaveBeenCalled();
    await act(async () => { await result.current.removeItem('x'); });
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('populates items from the initial snapshot', async () => {
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id' }),
    );
    await act(async () => { await Promise.resolve(); });

    act(() => {
      emitCollectionSnapshot('users/u1/library', [
        { id: 'a', data: { name: 'Alpha', value: 1 } },
        { id: 'b', data: { name: 'Beta', value: 2 } },
      ]);
    });

    expect(result.current.items).toEqual([
      { id: 'a', name: 'Alpha', value: 1 },
      { id: 'b', name: 'Beta', value: 2 },
    ]);
    expect(result.current.hydrated).toBe(true);
  });

  it('addItem fires setDoc with the correct path and item', async () => {
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id' }),
    );
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.addItem({ id: 'newItem', name: 'N', value: 5 });
    });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/u1/library', 'newItem');
    expect(mockSetDoc).toHaveBeenCalledOnce();
    expect(mockSetDoc.mock.calls[0][1]).toEqual({ id: 'newItem', name: 'N', value: 5 });
  });

  it('removeItem fires deleteDoc with the correct path', async () => {
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id' }),
    );
    await act(async () => { await Promise.resolve(); });

    await act(async () => { await result.current.removeItem('abc'); });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/u1/library', 'abc');
    expect(mockDeleteDoc).toHaveBeenCalledOnce();
  });

  it('coalesces rapid updateItem calls into a single debounced setDoc', async () => {
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id', debounceMs: 400 }),
    );
    await act(async () => { await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => {
      await result.current.updateItem('a', { name: 'first' });
      await result.current.updateItem('a', { name: 'second' });
      await result.current.updateItem('a', { value: 99 });
    });
    expect(mockSetDoc).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const [, payload, options] = mockSetDoc.mock.calls[0];
    expect(payload).toEqual({ name: 'second', value: 99 });
    expect(options).toEqual({ merge: true });
  });

  it('flushes pending debounced updateItem on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id', debounceMs: 500 }),
    );
    await act(async () => { await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { await result.current.updateItem('a', { name: 'pending' }); });
    expect(mockSetDoc).not.toHaveBeenCalled();

    unmount();
    expect(mockSetDoc).toHaveBeenCalledOnce();
    expect(mockSetDoc.mock.calls[0][1]).toEqual({ name: 'pending' });
  });

  it('transitions status idle → saving → saved → idle', async () => {
    let resolveWrite!: () => void;
    mockSetDoc.mockImplementation(() => new Promise<void>((r) => { resolveWrite = r; }));

    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', {
        idField: 'id',
        savedLingerMs: 1000,
      }),
    );
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('idle');

    let addPromise!: Promise<void>;
    act(() => {
      addPromise = result.current.addItem({ id: 'x', name: 'X', value: 1 });
    });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe('saving');

    await act(async () => {
      resolveWrite();
      await addPromise;
      await Promise.resolve();
    });
    expect(result.current.status).toBe('saved');

    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(result.current.status).toBe('idle');
  });

  it('reports error when addItem rejects', async () => {
    mockSetDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() =>
      useFirestoreCollection<Item>('users/u1/library', { idField: 'id' }),
    );
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      await result.current.addItem({ id: 'x', name: 'X', value: 1 });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('permission-denied');
  });
});
