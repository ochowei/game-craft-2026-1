import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockOnSnapshotImpl,
  mockDocSnapshot,
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
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(),
  collection: vi.fn(),
  collectionGroup: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  getDocFromServer: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

import { TokensProvider, useTokens } from './TokensContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_TOKENS } from '../domain/tokens';

function Probe() {
  const { tokens, activeCategory, selectedTokenId, dispatch } = useTokens();
  return (
    <div>
      <span data-testid="count">{tokens.length}</span>
      <span data-testid="cat">{activeCategory}</span>
      <span data-testid="selected">{selectedTokenId ?? 'none'}</span>
      <button data-testid="add" onClick={() => dispatch({ type: 'ADD_TOKEN' })}>add</button>
      <button data-testid="select" onClick={() => tokens[0] && dispatch({ type: 'SELECT_TOKEN', tokenId: tokens[0].id })}>sel</button>
      <button data-testid="set-cat" onClick={() => dispatch({ type: 'SET_CATEGORY', category: 'pawn' })}>cat</button>
    </div>
  );
}

describe('TokensContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('persists only the tokens array (not UI fields)', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <TokensProvider activeProjectId="p_1"><Probe /></TokensProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('add').click(); });
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalled();
    const [ref, payload] = mockSetDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1/design/tokens');
    expect(Array.isArray(payload.tokens)).toBe(true);
    expect(payload.selectedTokenId).toBeUndefined();
    expect(payload.activeCategory).toBeUndefined();
  });

  it('SELECT_TOKEN and SET_CATEGORY do not trigger writes', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { tokens: DEFAULT_TOKENS }));
    render(
      <SyncStatusProvider>
        <TokensProvider activeProjectId="p_1"><Probe /></TokensProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('select').click(); });
    await act(async () => { screen.getByTestId('set-cat').click(); });
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
