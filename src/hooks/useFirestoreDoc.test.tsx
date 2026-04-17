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
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(() => ({ _type: 'ts' })),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue(undefined),
}));

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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(result.current.status).toBe('idle');

    act(() => { result.current.dispatch({ type: 'INC' }); });
    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); });
    expect(result.current.status).toBe('saving');

    await act(async () => { resolveWrite(); await Promise.resolve(); await Promise.resolve(); });
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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });

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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

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
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });

    act(() => { result.current.dispatch({ type: 'INC' }); });
    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); await Promise.resolve(); });
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('permission-denied');
  });

  it('does not echo a remote-sync back to Firestore', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { count: 1 }));
    const { result } = renderHook(() =>
      useFirestoreDoc<Counter, CounterAction>('projects/p/design/x', {
        defaults: { count: 0 },
        reducer,
        debounceMs: 100,
      }),
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    act(() => { emitSnapshot('projects/p/design/x', { count: 99 }); });
    expect(result.current.state).toEqual({ count: 99 });

    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
